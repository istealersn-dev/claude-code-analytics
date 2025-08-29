import { DatabaseConnection } from './connection.js';

export interface RetentionConfig {
  sessionRetentionDays: number;
  messageRetentionDays: number;
  metricsRetentionDays: number;
  syncMetadataRetentionDays: number;
  batchSize: number;
  dryRun: boolean;
}

export interface RetentionResult {
  success: boolean;
  deleted: {
    sessions: number;
    messages: number;
    metrics: number;
    syncMetadata: number;
  };
  errors: Array<{
    table: string;
    error: string;
  }>;
  timing: {
    startTime: Date;
    endTime: Date;
    durationMs: number;
  };
}

export interface RetentionStats {
  tables: Array<{
    table: string;
    totalRecords: number;
    eligibleForDeletion: number;
    oldestRecord?: Date;
    newestRecord?: Date;
    sizeOnDisk?: string;
  }>;
  totalEligibleRecords: number;
  estimatedSpaceReclaimed?: string;
}

export class DataRetentionManager {
  private db: DatabaseConnection;
  private defaultConfig: RetentionConfig;

  constructor(db?: DatabaseConnection) {
    this.db = db || DatabaseConnection.getInstance();
    this.defaultConfig = {
      sessionRetentionDays: parseInt(process.env['RETENTION_DAYS'] || '90'),
      messageRetentionDays: parseInt(process.env['MESSAGE_RETENTION_DAYS'] || '90'),
      metricsRetentionDays: parseInt(process.env['METRICS_RETENTION_DAYS'] || '90'),
      syncMetadataRetentionDays: parseInt(process.env['SYNC_RETENTION_DAYS'] || '30'),
      batchSize: parseInt(process.env['RETENTION_BATCH_SIZE'] || '1000'),
      dryRun: false
    };
  }

  async getRetentionStats(config: Partial<RetentionConfig> = {}): Promise<RetentionStats> {
    const fullConfig = { ...this.defaultConfig, ...config };
    
    const tables = [
      {
        name: 'sessions',
        retentionDays: fullConfig.sessionRetentionDays,
        dateColumn: 'started_at'
      },
      {
        name: 'raw_messages',
        retentionDays: fullConfig.messageRetentionDays,
        dateColumn: 'timestamp'
      },
      {
        name: 'session_metrics',
        retentionDays: fullConfig.metricsRetentionDays,
        dateColumn: 'created_at'
      },
      {
        name: 'sync_metadata',
        retentionDays: fullConfig.syncMetadataRetentionDays,
        dateColumn: 'created_at'
      }
    ];

    const stats: RetentionStats = {
      tables: [],
      totalEligibleRecords: 0
    };

    for (const table of tables) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - table.retentionDays);

      const query = `
        WITH table_stats AS (
          SELECT 
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE ${table.dateColumn} < $1) as eligible_for_deletion,
            MIN(${table.dateColumn}) as oldest_record,
            MAX(${table.dateColumn}) as newest_record
          FROM ${table.name}
        ),
        size_info AS (
          SELECT 
            pg_size_pretty(pg_total_relation_size('${table.name}')) as size_on_disk
        )
        SELECT 
          ts.*,
          si.size_on_disk
        FROM table_stats ts
        CROSS JOIN size_info si
      `;

      try {
        const result = await this.db.query(query, [cutoffDate]);
        const row = result.rows[0];

        const tableStats = {
          table: table.name,
          totalRecords: parseInt(row.total_records),
          eligibleForDeletion: parseInt(row.eligible_for_deletion),
          oldestRecord: row.oldest_record,
          newestRecord: row.newest_record,
          sizeOnDisk: row.size_on_disk
        };

        stats.tables.push(tableStats);
        stats.totalEligibleRecords += tableStats.eligibleForDeletion;
      } catch (error) {
        console.warn(`Failed to get stats for table ${table.name}:`, error);
        stats.tables.push({
          table: table.name,
          totalRecords: 0,
          eligibleForDeletion: 0
        });
      }
    }

    return stats;
  }

  async cleanupOldData(config: Partial<RetentionConfig> = {}): Promise<RetentionResult> {
    const startTime = new Date();
    const fullConfig = { ...this.defaultConfig, ...config };

    console.log('🧹 Starting data retention cleanup...');
    console.log(`📅 Session retention: ${fullConfig.sessionRetentionDays} days`);
    console.log(`💬 Message retention: ${fullConfig.messageRetentionDays} days`);
    console.log(`📊 Metrics retention: ${fullConfig.metricsRetentionDays} days`);
    console.log(`🔄 Sync metadata retention: ${fullConfig.syncMetadataRetentionDays} days`);
    
    if (fullConfig.dryRun) {
      console.log('🧪 Running in DRY RUN mode - no data will be deleted');
    }

    const result: RetentionResult = {
      success: false,
      deleted: {
        sessions: 0,
        messages: 0,
        metrics: 0,
        syncMetadata: 0
      },
      errors: [],
      timing: {
        startTime,
        endTime: new Date(),
        durationMs: 0
      }
    };

    try {
      // Clean up raw_messages first (due to foreign key constraints)
      const messagesDeleted = await this.cleanupTable(
        'raw_messages',
        'timestamp',
        fullConfig.messageRetentionDays,
        fullConfig.batchSize,
        fullConfig.dryRun
      );
      result.deleted.messages = messagesDeleted;

      // Clean up session_metrics (due to foreign key constraints)
      const metricsDeleted = await this.cleanupTable(
        'session_metrics',
        'created_at',
        fullConfig.metricsRetentionDays,
        fullConfig.batchSize,
        fullConfig.dryRun
      );
      result.deleted.metrics = metricsDeleted;

      // Clean up sessions (parent table)
      const sessionsDeleted = await this.cleanupTable(
        'sessions',
        'started_at',
        fullConfig.sessionRetentionDays,
        fullConfig.batchSize,
        fullConfig.dryRun
      );
      result.deleted.sessions = sessionsDeleted;

      // Clean up sync_metadata
      const syncDeleted = await this.cleanupTable(
        'sync_metadata',
        'created_at',
        fullConfig.syncMetadataRetentionDays,
        fullConfig.batchSize,
        fullConfig.dryRun
      );
      result.deleted.syncMetadata = syncDeleted;

      // Run VACUUM ANALYZE to reclaim space and update statistics
      if (!fullConfig.dryRun && (
        result.deleted.sessions > 0 ||
        result.deleted.messages > 0 ||
        result.deleted.metrics > 0 ||
        result.deleted.syncMetadata > 0
      )) {
        console.log('🔧 Running VACUUM ANALYZE to reclaim space...');
        await this.db.query('VACUUM ANALYZE');
        console.log('✅ Database optimization complete');
      }

      result.success = result.errors.length === 0;

      const totalDeleted = Object.values(result.deleted).reduce((sum, count) => sum + count, 0);
      
      if (fullConfig.dryRun) {
        console.log(`🧪 DRY RUN: Would delete ${totalDeleted} records`);
      } else {
        console.log(`✅ Cleanup complete: Deleted ${totalDeleted} records`);
      }

    } catch (error) {
      console.error('💥 Cleanup failed:', error);
      result.errors.push({
        table: 'general',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    result.timing.endTime = new Date();
    result.timing.durationMs = result.timing.endTime.getTime() - startTime.getTime();

    console.log(`⏱️ Cleanup completed in ${result.timing.durationMs}ms`);
    
    return result;
  }

  private async cleanupTable(
    tableName: string,
    dateColumn: string,
    retentionDays: number,
    batchSize: number,
    dryRun: boolean
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`🗑️ Cleaning up ${tableName} (older than ${cutoffDate.toISOString().split('T')[0]})`);

    // First, count how many records would be deleted
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM ${tableName} 
      WHERE ${dateColumn} < $1
    `;

    const countResult = await this.db.query(countQuery, [cutoffDate]);
    const totalToDelete = parseInt(countResult.rows[0].count);

    if (totalToDelete === 0) {
      console.log(`  ✨ No old records found in ${tableName}`);
      return 0;
    }

    if (dryRun) {
      console.log(`  🧪 Would delete ${totalToDelete} records from ${tableName}`);
      return totalToDelete;
    }

    // Delete in batches to avoid locking the table for too long
    let totalDeleted = 0;
    let batchCount = 0;

    while (totalDeleted < totalToDelete) {
      const deleteQuery = `
        DELETE FROM ${tableName} 
        WHERE ${dateColumn} < $1
        AND ctid IN (
          SELECT ctid FROM ${tableName} 
          WHERE ${dateColumn} < $1 
          LIMIT $2
        )
      `;

      const deleteResult = await this.db.query(deleteQuery, [cutoffDate, batchSize]);
      const deletedInBatch = deleteResult.rowCount || 0;
      
      if (deletedInBatch === 0) {
        break; // No more records to delete
      }

      totalDeleted += deletedInBatch;
      batchCount++;

      console.log(`  📦 Batch ${batchCount}: Deleted ${deletedInBatch} records from ${tableName} (${totalDeleted}/${totalToDelete})`);

      // Small delay to prevent overwhelming the database
      if (batchCount % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`  ✅ Deleted ${totalDeleted} records from ${tableName}`);
    return totalDeleted;
  }

  async scheduleCleanup(cronExpression: string = '0 2 * * *'): Promise<void> {
    // This would typically integrate with a job scheduler like node-cron
    // For now, we'll just log the schedule
    console.log(`📅 Data retention cleanup scheduled: ${cronExpression}`);
    console.log('⚠️ Automatic scheduling not yet implemented - run manually via API');
  }

  async getOldestRecords(limit: number = 10): Promise<Array<{
    table: string;
    id: string;
    date: Date;
    age_days: number;
  }>> {
    const query = `
      SELECT 'sessions' as table, session_id as id, started_at as date, 
             EXTRACT(days FROM NOW() - started_at) as age_days
      FROM sessions
      ORDER BY started_at ASC
      LIMIT $1
      
      UNION ALL
      
      SELECT 'raw_messages' as table, id::text as id, timestamp as date,
             EXTRACT(days FROM NOW() - timestamp) as age_days  
      FROM raw_messages
      ORDER BY timestamp ASC
      LIMIT $1
      
      UNION ALL
      
      SELECT 'session_metrics' as table, id::text as id, created_at as date,
             EXTRACT(days FROM NOW() - created_at) as age_days
      FROM session_metrics
      ORDER BY created_at ASC
      LIMIT $1
      
      ORDER BY date ASC
      LIMIT $1
    `;

    const result = await this.db.query(query, [limit]);
    return result.rows;
  }

  async validateRetentionPolicy(): Promise<{
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  }> {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for very short retention periods
    if (this.defaultConfig.sessionRetentionDays < 7) {
      warnings.push('Session retention period is less than 7 days - this may result in data loss');
    }

    if (this.defaultConfig.messageRetentionDays < this.defaultConfig.sessionRetentionDays) {
      warnings.push('Message retention is shorter than session retention - orphaned sessions may occur');
    }

    // Check database size
    const stats = await this.getRetentionStats();
    const totalEligible = stats.totalEligibleRecords;

    if (totalEligible > 10000) {
      recommendations.push('Large number of records eligible for deletion - consider running cleanup in smaller batches');
    }

    if (totalEligible === 0) {
      recommendations.push('No records eligible for deletion - retention policy may be too generous');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations
    };
  }
}