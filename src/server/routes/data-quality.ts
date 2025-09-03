import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AnalyticsQueryBuilder } from '../../database/query-builder.js';

interface DataQualityMetrics {
  totalSessions: number;
  completeSessions: number;
  incompleteSessions: number;
  duplicateSessions: number;
  orphanedMetrics: number;
  missingData: {
    sessionsWithoutEndTime: number;
    sessionsWithoutDuration: number;
    sessionsWithoutTokens: number;
    sessionsWithoutCost: number;
    metricsWithoutMessages: number;
  };
  dataIntegrity: {
    negativeTokens: number;
    negativeCosts: number;
    invalidDurations: number;
    futureTimestamps: number;
    inconsistentAggregates: number;
  };
  dataCompleteness: {
    completenessScore: number; // 0-100
    missingFields: string[];
    qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  duplicateAnalysis: Array<{
    sessionId: string;
    duplicateCount: number;
    firstSeen: string;
    lastSeen: string;
  }>;
  recommendations: Array<{
    type: 'warning' | 'error' | 'info';
    title: string;
    description: string;
    affectedRecords: number;
    action?: string;
  }>;
}

export const dataQualityRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const queryBuilder = new AnalyticsQueryBuilder();
  // Access the database connection through the query builder's private property
  // This is a temporary workaround until we add data quality methods to the query builder
  const db = (queryBuilder as any).db;

  // Get comprehensive data quality metrics
  app.get('/metrics', async (_request, reply) => {
    try {
      const [
        totalSessions,
        completeSessions,
        duplicateData,
        missingData,
        integrityIssues,
        orphanedMetrics
      ] = await Promise.all([
        // Total sessions count
        db.query('SELECT COUNT(*) as count FROM sessions'),
        
        // Complete sessions (have end time and duration)
        db.query(`
          SELECT COUNT(*) as count 
          FROM sessions 
          WHERE ended_at IS NOT NULL 
            AND duration_seconds IS NOT NULL 
            AND duration_seconds > 0
        `),
        
        // Duplicate session IDs
        db.query(`
          SELECT session_id, COUNT(*) as duplicate_count,
                 MIN(created_at) as first_seen,
                 MAX(created_at) as last_seen
          FROM sessions 
          GROUP BY session_id 
          HAVING COUNT(*) > 1
          ORDER BY duplicate_count DESC
          LIMIT 50
        `),
        
        // Missing data analysis
        db.query(`
          SELECT 
            COUNT(*) FILTER (WHERE ended_at IS NULL) as sessions_without_end_time,
            COUNT(*) FILTER (WHERE duration_seconds IS NULL OR duration_seconds <= 0) as sessions_without_duration,
            COUNT(*) FILTER (WHERE total_input_tokens = 0 AND total_output_tokens = 0) as sessions_without_tokens,
            COUNT(*) FILTER (WHERE total_cost_usd = 0) as sessions_without_cost
          FROM sessions
        `),
        
        // Data integrity issues
        db.query(`
          SELECT 
            COUNT(*) FILTER (WHERE total_input_tokens < 0 OR total_output_tokens < 0) as negative_tokens,
            COUNT(*) FILTER (WHERE total_cost_usd < 0) as negative_costs,
            COUNT(*) FILTER (WHERE duration_seconds < 0) as invalid_durations,
            COUNT(*) FILTER (WHERE started_at > NOW() OR ended_at > NOW()) as future_timestamps,
            COUNT(*) FILTER (WHERE ended_at < started_at) as inconsistent_timestamps
          FROM sessions
        `),
        
        // Orphaned session metrics (metrics without parent session)
        db.query(`
          SELECT COUNT(*) as count
          FROM session_metrics sm
          LEFT JOIN sessions s ON sm.session_id = s.id
          WHERE s.id IS NULL
        `)
      ]);

      // Calculate metrics without messages
      const metricsWithoutMessages = await db.query(`
        SELECT COUNT(*) as count
        FROM session_metrics sm
        WHERE sm.message_count = 0
          AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = sm.session_id)
      `);

      const totalCount = parseInt(String(totalSessions.rows[0]?.count || 0));
      const completeCount = parseInt(String(completeSessions.rows[0]?.count || 0));
      const duplicateCount = duplicateData.rows.length;
      
      // Build missing data object
      const missingDataRow = missingData.rows[0] || {};
      const missing = {
        sessionsWithoutEndTime: parseInt(String(missingDataRow.sessions_without_end_time || '0')),
        sessionsWithoutDuration: parseInt(String(missingDataRow.sessions_without_duration || '0')),
        sessionsWithoutTokens: parseInt(String(missingDataRow.sessions_without_tokens || '0')),
        sessionsWithoutCost: parseInt(String(missingDataRow.sessions_without_cost || '0')),
        metricsWithoutMessages: parseInt(String(metricsWithoutMessages.rows[0]?.count || '0')),
      };

      // Build integrity issues object
      const integrityRow = integrityIssues.rows[0] || {};
      const integrity = {
        negativeTokens: parseInt(String(integrityRow.negative_tokens || '0')),
        negativeCosts: parseInt(String(integrityRow.negative_costs || '0')),
        invalidDurations: parseInt(String(integrityRow.invalid_durations || '0')),
        futureTimestamps: parseInt(String(integrityRow.future_timestamps || '0')),
        inconsistentAggregates: parseInt(String(integrityRow.inconsistent_timestamps || '0')),
      };

      // Calculate completeness score
      const totalIssues = Object.values(missing).reduce((sum, val) => sum + val, 0) +
                         Object.values(integrity).reduce((sum, val) => sum + val, 0);
      const completenessScore = totalCount > 0 ? Math.max(0, Math.round((1 - totalIssues / totalCount) * 100)) : 100;
      
      // Determine quality grade
      let qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
      if (completenessScore >= 95) qualityGrade = 'A';
      else if (completenessScore >= 85) qualityGrade = 'B';
      else if (completenessScore >= 75) qualityGrade = 'C';
      else if (completenessScore >= 60) qualityGrade = 'D';
      else qualityGrade = 'F';

      // Generate recommendations
      const recommendations: Array<{
        type: 'warning' | 'error' | 'info';
        title: string;
        description: string;
        affectedRecords: number;
        action?: string;
      }> = [];

      if (duplicateCount > 0) {
        recommendations.push({
          type: 'error',
          title: 'Duplicate Sessions Detected',
          description: `Found ${duplicateCount} session IDs with multiple records. This may cause incorrect analytics.`,
          affectedRecords: duplicateCount,
          action: 'Review and merge duplicate sessions'
        });
      }

      if (missing.sessionsWithoutEndTime > 0) {
        recommendations.push({
          type: 'warning',
          title: 'Incomplete Sessions',
          description: `${missing.sessionsWithoutEndTime} sessions are missing end times, indicating incomplete data.`,
          affectedRecords: missing.sessionsWithoutEndTime,
          action: 'Re-sync recent sessions'
        });
      }

      if (integrity.negativeTokens > 0 || integrity.negativeCosts > 0) {
        recommendations.push({
          type: 'error',
          title: 'Invalid Data Values',
          description: `Found negative values in token counts or costs. This indicates data corruption.`,
          affectedRecords: integrity.negativeTokens + integrity.negativeCosts,
          action: 'Investigate and correct invalid records'
        });
      }

      if (totalCount > 1000 && duplicateCount === 0 && totalIssues < 10) {
        recommendations.push({
          type: 'info',
          title: 'Excellent Data Quality',
          description: 'Your data quality is excellent with minimal issues detected.',
          affectedRecords: 0
        });
      }

      const metrics: DataQualityMetrics = {
        totalSessions: totalCount,
        completeSessions: completeCount,
        incompleteSessions: totalCount - completeCount,
        duplicateSessions: duplicateCount,
        orphanedMetrics: parseInt(String(orphanedMetrics.rows[0]?.count || '0')),
        missingData: missing,
        dataIntegrity: integrity,
        dataCompleteness: {
          completenessScore,
          missingFields: [], // TODO: Implement field-level analysis
          qualityGrade,
        },
        duplicateAnalysis: duplicateData.rows.map((row: any) => ({
          sessionId: row.session_id,
          duplicateCount: parseInt(row.duplicate_count),
          firstSeen: row.first_seen,
          lastSeen: row.last_seen,
        })),
        recommendations,
      };

      return reply.send({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      app.log.error(`Data quality metrics error: ${error}`);
      return reply.status(500).send(
        app.httpErrors.internalServerError('Failed to fetch data quality metrics')
      );
    }
  });

  // Clean up duplicate sessions
  app.post('/cleanup/duplicates', async (request, reply) => {
    try {
      // Find and remove duplicate sessions, keeping the most recent one
      const cleanupResult = await db.query(`
        WITH duplicates AS (
          SELECT id, session_id,
                 ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at DESC) as rn
          FROM sessions
        ),
        deleted AS (
          DELETE FROM sessions 
          WHERE id IN (
            SELECT id FROM duplicates WHERE rn > 1
          )
          RETURNING session_id
        )
        SELECT COUNT(*) as deleted_count FROM deleted
      `);

      const deletedCount = cleanupResult.rows[0]?.deleted_count || 0;

      return reply.send({
        success: true,
        data: {
          deletedRecords: parseInt(String(deletedCount)),
          message: `Successfully removed ${deletedCount} duplicate sessions`
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      app.log.error(`Duplicate cleanup error: ${error}`);
      return reply.status(500).send(
        app.httpErrors.internalServerError('Failed to cleanup duplicate sessions')
      );
    }
  });

  // Fix orphaned metrics
  app.post('/cleanup/orphaned-metrics', async (request, reply) => {
    try {
      const cleanupResult = await db.query(`
        WITH orphaned AS (
          DELETE FROM session_metrics 
          WHERE session_id NOT IN (SELECT id FROM sessions)
          RETURNING id
        )
        SELECT COUNT(*) as deleted_count FROM orphaned
      `);

      const deletedCount = cleanupResult.rows[0]?.deleted_count || 0;

      return reply.send({
        success: true,
        data: {
          deletedRecords: parseInt(String(deletedCount)),
          message: `Successfully removed ${deletedCount} orphaned metric records`
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      app.log.error(`Orphaned metrics cleanup error: ${error}`);
      return reply.status(500).send(
        app.httpErrors.internalServerError('Failed to cleanup orphaned metrics')
      );
    }
  });

  // Validate data integrity
  app.post('/validate', async (request, reply) => {
    try {
      // Run comprehensive validation checks
      const validationResults = await db.query(`
        SELECT 
          'sessions' as table_name,
          COUNT(*) as total_records,
          COUNT(*) FILTER (WHERE session_id IS NULL OR session_id = '') as invalid_session_ids,
          COUNT(*) FILTER (WHERE started_at IS NULL) as missing_start_times,
          COUNT(*) FILTER (WHERE model_name IS NULL OR model_name = '') as missing_models
        FROM sessions
        
        UNION ALL
        
        SELECT 
          'session_metrics' as table_name,
          COUNT(*) as total_records,
          COUNT(*) FILTER (WHERE session_id IS NULL) as invalid_session_refs,
          COUNT(*) FILTER (WHERE date_bucket IS NULL) as missing_dates,
          COUNT(*) FILTER (WHERE input_tokens < 0 OR output_tokens < 0) as negative_tokens
        FROM session_metrics
      `);

      return reply.send({
        success: true,
        data: {
          validationResults: validationResults.rows,
          timestamp: new Date().toISOString(),
        }
      });

    } catch (error) {
      app.log.error(`Data validation error: ${error}`);
      return reply.status(500).send(
        app.httpErrors.internalServerError('Failed to validate data integrity')
      );
    }
  });
};