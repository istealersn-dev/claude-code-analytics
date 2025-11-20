import type { PoolClient } from 'pg';
import type {
  DatabaseMessage,
  DatabaseSession,
  DatabaseSessionEnhanced,
  ParsedSessionData,
  SessionMetrics,
  SessionMetricsEnhanced,
  SyncMetadata,
} from '../types/index.js';
import { DatabaseConnection } from './connection.js';

export interface InsertionResult {
  success: boolean;
  inserted: {
    sessions: number;
    messages: number;
    metrics: number;
  };
  errors: Array<{
    type: 'session' | 'message' | 'metric';
    data: Record<string, unknown>;
    error: string;
  }>;
  duplicatesSkipped: number;
}

export class DatabaseInserter {
  private db: DatabaseConnection;
  private hasCC2Schema: boolean | null = null;

  constructor(db?: DatabaseConnection) {
    this.db = db || DatabaseConnection.getInstance();
  }

  /**
   * Detect if database has Claude Code 2.0 schema columns
   */
  private async detectCC2Schema(client: PoolClient): Promise<boolean> {
    if (this.hasCC2Schema !== null) {
      return this.hasCC2Schema;
    }

    try {
      const query = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'sessions'
        AND column_name = 'is_extended_session'
      `;
      const result = await client.query(query);
      this.hasCC2Schema = result.rows.length > 0;
      return this.hasCC2Schema;
    } catch (error) {
      // If query fails, assume standard schema
      this.hasCC2Schema = false;
      return false;
    }
  }

  async insertSessionData(sessionData: ParsedSessionData): Promise<InsertionResult> {
    const result: InsertionResult = {
      success: false,
      inserted: { sessions: 0, messages: 0, metrics: 0 },
      errors: [],
      duplicatesSkipped: 0,
    };

    return await this.db.transaction(async (client) => {
      try {
        // Insert session with conflict handling
        const sessionResult = await this.insertOrUpdateSession(client, sessionData.session);
        if (sessionResult.inserted) {
          result.inserted.sessions = 1;
        } else {
          result.duplicatesSkipped += 1;
        }

        // Insert messages in batch
        if (sessionData.messages.length > 0) {
          const messagesResult = await this.batchInsertMessages(client, sessionData.messages);
          result.inserted.messages = messagesResult.inserted;
          result.errors.push(...messagesResult.errors);
        }

        // Insert metrics
        const metricsResult = await this.insertOrUpdateMetrics(client, sessionData.metrics);
        if (metricsResult.inserted) {
          result.inserted.metrics = 1;
        }

        result.success = result.errors.length === 0;
        return result;
      } catch (error) {
        result.errors.push({
          type: 'session',
          data: sessionData.session as unknown as Record<string, unknown>,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    });
  }

  async batchInsertSessions(sessionDataArray: ParsedSessionData[]): Promise<InsertionResult> {
    const result: InsertionResult = {
      success: false,
      inserted: { sessions: 0, messages: 0, metrics: 0 },
      errors: [],
      duplicatesSkipped: 0,
    };

    return await this.db.transaction(async (client) => {
      for (const sessionData of sessionDataArray) {
        try {
          const singleResult = await this.insertSessionDataInTransaction(client, sessionData);
          result.inserted.sessions += singleResult.inserted.sessions;
          result.inserted.messages += singleResult.inserted.messages;
          result.inserted.metrics += singleResult.inserted.metrics;
          result.duplicatesSkipped += singleResult.duplicatesSkipped;
          result.errors.push(...singleResult.errors);
        } catch (error) {
          result.errors.push({
            type: 'session',
            data: sessionData.session as unknown as Record<string, unknown>,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      result.success = result.errors.length === 0;
      return result;
    });
  }

  private async insertSessionDataInTransaction(
    client: PoolClient,
    sessionData: ParsedSessionData,
  ): Promise<InsertionResult> {
    const result: InsertionResult = {
      success: false,
      inserted: { sessions: 0, messages: 0, metrics: 0 },
      errors: [],
      duplicatesSkipped: 0,
    };

    // Insert session
    const sessionResult = await this.insertOrUpdateSession(client, sessionData.session);
    if (sessionResult.inserted) {
      result.inserted.sessions = 1;
    } else {
      result.duplicatesSkipped += 1;
    }

    // Insert messages
    if (sessionData.messages.length > 0) {
      const messagesResult = await this.batchInsertMessages(client, sessionData.messages);
      result.inserted.messages = messagesResult.inserted;
      result.errors.push(...messagesResult.errors);
    }

    // Insert metrics
    const metricsResult = await this.insertOrUpdateMetrics(client, sessionData.metrics);
    if (metricsResult.inserted) {
      result.inserted.metrics = 1;
    }

    result.success = result.errors.length === 0;
    return result;
  }

  private async insertOrUpdateSession(
    client: PoolClient,
    session: DatabaseSessionEnhanced,
  ): Promise<{ inserted: boolean; sessionId?: string }> {
    const hasCC2 = await this.detectCC2Schema(client);

    let insertQuery: string;
    let values: unknown[];

    if (hasCC2) {
      // Claude Code 2.0 schema with enhanced fields
      insertQuery = `
        INSERT INTO sessions (
          session_id, project_name, started_at, ended_at, duration_seconds,
          model_name, total_input_tokens, total_output_tokens, total_cost_usd,
          tools_used, cache_hit_count, cache_miss_count,
          is_extended_session, has_background_tasks, has_subagents, has_vscode_integration,
          session_type, autonomy_level
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        ON CONFLICT (session_id) DO UPDATE SET
          ended_at = EXCLUDED.ended_at,
          duration_seconds = EXCLUDED.duration_seconds,
          total_input_tokens = EXCLUDED.total_input_tokens,
          total_output_tokens = EXCLUDED.total_output_tokens,
          total_cost_usd = EXCLUDED.total_cost_usd,
          tools_used = EXCLUDED.tools_used,
          cache_hit_count = EXCLUDED.cache_hit_count,
          cache_miss_count = EXCLUDED.cache_miss_count,
          is_extended_session = EXCLUDED.is_extended_session,
          has_background_tasks = EXCLUDED.has_background_tasks,
          has_subagents = EXCLUDED.has_subagents,
          has_vscode_integration = EXCLUDED.has_vscode_integration,
          session_type = EXCLUDED.session_type,
          autonomy_level = EXCLUDED.autonomy_level,
          updated_at = NOW()
        RETURNING id, session_id,
          (xmax = 0) AS inserted
      `;

      values = [
        session.session_id,
        session.project_name,
        session.started_at,
        session.ended_at,
        session.duration_seconds,
        session.model_name,
        session.total_input_tokens,
        session.total_output_tokens,
        session.total_cost_usd,
        session.tools_used,
        session.cache_hit_count,
        session.cache_miss_count,
        session.is_extended_session,
        session.has_background_tasks,
        session.has_subagents,
        session.has_vscode_integration,
        session.session_type,
        session.autonomy_level,
      ];
    } else {
      // Standard schema without CC2 fields
      insertQuery = `
        INSERT INTO sessions (
          session_id, project_name, started_at, ended_at, duration_seconds,
          model_name, total_input_tokens, total_output_tokens, total_cost_usd,
          tools_used, cache_hit_count, cache_miss_count
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        ON CONFLICT (session_id) DO UPDATE SET
          ended_at = EXCLUDED.ended_at,
          duration_seconds = EXCLUDED.duration_seconds,
          total_input_tokens = EXCLUDED.total_input_tokens,
          total_output_tokens = EXCLUDED.total_output_tokens,
          total_cost_usd = EXCLUDED.total_cost_usd,
          tools_used = EXCLUDED.tools_used,
          cache_hit_count = EXCLUDED.cache_hit_count,
          cache_miss_count = EXCLUDED.cache_miss_count,
          updated_at = NOW()
        RETURNING id, session_id,
          (xmax = 0) AS inserted
      `;

      values = [
        session.session_id,
        session.project_name,
        session.started_at,
        session.ended_at,
        session.duration_seconds,
        session.model_name,
        session.total_input_tokens,
        session.total_output_tokens,
        session.total_cost_usd,
        session.tools_used,
        session.cache_hit_count,
        session.cache_miss_count,
      ];
    }

    const result = await client.query(insertQuery, values);
    const row = result.rows[0];

    return {
      inserted: row.inserted,
      sessionId: row.id,
    };
  }

  private async batchInsertMessages(
    client: PoolClient,
    messages: DatabaseMessage[],
  ): Promise<{
    inserted: number;
    errors: Array<{
      type: 'session' | 'message' | 'metric';
      data: Record<string, unknown>;
      error: string;
    }>;
  }> {
    const errors: Array<{
      type: 'session' | 'message' | 'metric';
      data: Record<string, unknown>;
      error: string;
    }> = [];
    let inserted = 0;

    // First, get the actual session UUID from session_id string
    const sessionIdQuery = 'SELECT id FROM sessions WHERE session_id = $1';
    const sessionResult = await client.query(sessionIdQuery, [messages[0]?.session_id]);

    if (sessionResult.rows.length === 0) {
      throw new Error(`Session not found: ${messages[0]?.session_id}`);
    }

    const sessionUuid = sessionResult.rows[0].id;

    // Clear existing messages for this session to avoid duplicates
    await client.query('DELETE FROM raw_messages WHERE session_id = $1', [sessionUuid]);

    // Batch insert messages
    const batchSize = 100;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      const insertQuery = `
        INSERT INTO raw_messages (
          session_id, message_index, role, content, content_length,
          input_tokens, output_tokens, tool_name, tool_input, tool_output,
          timestamp, processing_time_ms
        ) VALUES ${batch
          .map(
            (_, idx) =>
              `($${idx * 12 + 1}, $${idx * 12 + 2}, $${idx * 12 + 3}, $${idx * 12 + 4}, $${idx * 12 + 5}, 
           $${idx * 12 + 6}, $${idx * 12 + 7}, $${idx * 12 + 8}, $${idx * 12 + 9}, $${idx * 12 + 10}, 
           $${idx * 12 + 11}, $${idx * 12 + 12})`,
          )
          .join(', ')}
      `;

      const values = batch.flatMap((msg) => [
        sessionUuid,
        msg.message_index,
        msg.role,
        msg.content,
        msg.content_length,
        msg.input_tokens,
        msg.output_tokens,
        msg.tool_name,
        msg.tool_input,
        msg.tool_output,
        msg.timestamp,
        msg.processing_time_ms,
      ]);

      try {
        const result = await client.query(insertQuery, values);
        inserted += result.rowCount || 0;
      } catch (error) {
        errors.push({
          type: 'message',
          data: batch as unknown as Record<string, unknown>,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { inserted, errors };
  }

  private async insertOrUpdateMetrics(
    client: PoolClient,
    metrics: SessionMetricsEnhanced,
  ): Promise<{ inserted: boolean }> {
    // Get session UUID
    const sessionIdQuery = 'SELECT id FROM sessions WHERE session_id = $1';
    const sessionResult = await client.query(sessionIdQuery, [metrics.session_id]);

    if (sessionResult.rows.length === 0) {
      throw new Error(`Session not found: ${metrics.session_id}`);
    }

    const sessionUuid = sessionResult.rows[0].id;
    const hasCC2 = await this.detectCC2Schema(client);

    let insertQuery: string;
    let values: unknown[];

    if (hasCC2) {
      // Claude Code 2.0 schema with enhanced metrics
      insertQuery = `
        INSERT INTO session_metrics (
          session_id, date_bucket, hour_bucket, weekday, week_of_year,
          month, year, input_tokens, output_tokens, cost_usd,
          duration_seconds, message_count, tool_usage_count, cache_efficiency,
          checkpoint_count, rewind_count, background_task_count, subagent_count,
          vscode_integration_count, autonomy_score, parallel_development_efficiency
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        ON CONFLICT (session_id) DO UPDATE SET
          input_tokens = EXCLUDED.input_tokens,
          output_tokens = EXCLUDED.output_tokens,
          cost_usd = EXCLUDED.cost_usd,
          duration_seconds = EXCLUDED.duration_seconds,
          message_count = EXCLUDED.message_count,
          tool_usage_count = EXCLUDED.tool_usage_count,
          cache_efficiency = EXCLUDED.cache_efficiency,
          checkpoint_count = EXCLUDED.checkpoint_count,
          rewind_count = EXCLUDED.rewind_count,
          background_task_count = EXCLUDED.background_task_count,
          subagent_count = EXCLUDED.subagent_count,
          vscode_integration_count = EXCLUDED.vscode_integration_count,
          autonomy_score = EXCLUDED.autonomy_score,
          parallel_development_efficiency = EXCLUDED.parallel_development_efficiency
        RETURNING (xmax = 0) AS inserted
      `;

      values = [
        sessionUuid,
        metrics.date_bucket,
        metrics.hour_bucket,
        metrics.weekday,
        metrics.week_of_year,
        metrics.month,
        metrics.year,
        metrics.input_tokens,
        metrics.output_tokens,
        metrics.cost_usd,
        metrics.duration_seconds,
        metrics.message_count,
        metrics.tool_usage_count,
        metrics.cache_efficiency,
        metrics.checkpoint_count,
        metrics.rewind_count,
        metrics.background_task_count,
        metrics.subagent_count,
        metrics.vscode_integration_count,
        metrics.autonomy_score,
        metrics.parallel_development_efficiency,
      ];
    } else {
      // Standard schema without CC2 fields
      insertQuery = `
        INSERT INTO session_metrics (
          session_id, date_bucket, hour_bucket, weekday, week_of_year,
          month, year, input_tokens, output_tokens, cost_usd,
          duration_seconds, message_count, tool_usage_count, cache_efficiency
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (session_id) DO UPDATE SET
          input_tokens = EXCLUDED.input_tokens,
          output_tokens = EXCLUDED.output_tokens,
          cost_usd = EXCLUDED.cost_usd,
          duration_seconds = EXCLUDED.duration_seconds,
          message_count = EXCLUDED.message_count,
          tool_usage_count = EXCLUDED.tool_usage_count,
          cache_efficiency = EXCLUDED.cache_efficiency
        RETURNING (xmax = 0) AS inserted
      `;

      values = [
        sessionUuid,
        metrics.date_bucket,
        metrics.hour_bucket,
        metrics.weekday,
        metrics.week_of_year,
        metrics.month,
        metrics.year,
        metrics.input_tokens,
        metrics.output_tokens,
        metrics.cost_usd,
        metrics.duration_seconds,
        metrics.message_count,
        metrics.tool_usage_count,
        metrics.cache_efficiency,
      ];
    }

    const result = await client.query(insertQuery, values);
    return { inserted: result.rows[0].inserted };
  }

  async checkForDuplicates(sessionIds: string[]): Promise<string[]> {
    if (sessionIds.length === 0) return [];

    const query = `
      SELECT session_id 
      FROM sessions 
      WHERE session_id = ANY($1)
    `;

    const result = await this.db.query<{ session_id: string }>(query, [sessionIds]);
    return result.rows.map((row) => row.session_id);
  }

  async getSessionStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    totalCost: number;
    dateRange: { earliest: Date | null; latest: Date | null };
  }> {
    const query = `
      SELECT 
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(m.id) as total_messages,
        COALESCE(SUM(s.total_cost_usd), 0) as total_cost,
        MIN(s.started_at) as earliest_session,
        MAX(s.started_at) as latest_session
      FROM sessions s
      LEFT JOIN raw_messages m ON s.id = m.session_id
    `;

    const result = await this.db.query<{
      total_sessions: string;
      total_messages: string;
      total_cost: string;
      earliest_session: Date | null;
      latest_session: Date | null;
    }>(query);
    const row = result.rows[0];

    if (!row) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        totalCost: 0,
        dateRange: { earliest: null, latest: null },
      };
    }

    return {
      totalSessions: Number.parseInt(row.total_sessions, 10),
      totalMessages: Number.parseInt(row.total_messages, 10),
      totalCost: Number.parseFloat(row.total_cost),
      dateRange: {
        earliest: row.earliest_session,
        latest: row.latest_session,
      },
    };
  }

  async cleanupOldData(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const query = `
      DELETE FROM sessions 
      WHERE started_at < $1
    `;

    const result = await this.db.query(query, [cutoffDate]);
    return result.rowCount || 0;
  }

  async getSyncMetadata(syncKey: string): Promise<SyncMetadata | null> {
    const query = `
      SELECT id, sync_key, last_sync_timestamp, files_processed, 
             sessions_processed, sync_status, error_message,
             created_at, updated_at
      FROM sync_metadata 
      WHERE sync_key = $1
    `;

    const result = await this.db.query<{
      id: string;
      sync_key: string;
      last_sync_timestamp: Date;
      files_processed: number;
      sessions_processed: number;
      sync_status: 'completed' | 'in_progress' | 'failed';
      error_message?: string;
      created_at?: Date;
      updated_at?: Date;
    }>(query, [syncKey]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      sync_key: row.sync_key,
      last_sync_timestamp: row.last_sync_timestamp,
      files_processed: row.files_processed,
      sessions_processed: row.sessions_processed,
      sync_status: row.sync_status,
      error_message: row.error_message,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async upsertSyncMetadata(
    metadata: Omit<SyncMetadata, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<void> {
    const query = `
      INSERT INTO sync_metadata (
        sync_key, last_sync_timestamp, files_processed, sessions_processed,
        sync_status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (sync_key) DO UPDATE SET
        last_sync_timestamp = EXCLUDED.last_sync_timestamp,
        files_processed = EXCLUDED.files_processed,
        sessions_processed = EXCLUDED.sessions_processed,
        sync_status = EXCLUDED.sync_status,
        error_message = EXCLUDED.error_message,
        updated_at = NOW()
    `;

    const values = [
      metadata.sync_key,
      metadata.last_sync_timestamp,
      metadata.files_processed,
      metadata.sessions_processed,
      metadata.sync_status,
      metadata.error_message,
    ];

    await this.db.query(query, values);
  }

  async getLastSyncTimestamp(): Promise<Date | null> {
    const metadata = await this.getSyncMetadata('global');
    return metadata?.last_sync_timestamp || null;
  }

  async getSessionConflictInfo(sessionId: string): Promise<{
    exists: boolean;
    lastUpdated?: Date;
    currentHash?: string;
  }> {
    const query = `
      SELECT session_id, updated_at, 
             md5(concat(
               COALESCE(ended_at::text, ''),
               COALESCE(duration_seconds::text, ''),
               COALESCE(total_input_tokens::text, ''),
               COALESCE(total_output_tokens::text, ''),
               COALESCE(total_cost_usd::text, '')
             )) as content_hash
      FROM sessions 
      WHERE session_id = $1
    `;

    const result = await this.db.query<{
      session_id: string;
      updated_at?: Date;
      content_hash?: string;
    }>(query, [sessionId]);

    if (result.rows.length === 0) {
      return { exists: false };
    }

    const row = result.rows[0];
    if (!row) return { exists: false };

    return {
      exists: true,
      lastUpdated: row.updated_at,
      currentHash: row.content_hash,
    };
  }

  async resolveSessionConflicts(sessions: DatabaseSession[]): Promise<{
    toInsert: DatabaseSession[];
    toUpdate: DatabaseSession[];
    toSkip: DatabaseSession[];
  }> {
    const toInsert: DatabaseSession[] = [];
    const toUpdate: DatabaseSession[] = [];
    const toSkip: DatabaseSession[] = [];

    for (const session of sessions) {
      const conflictInfo = await this.getSessionConflictInfo(session.session_id);

      if (!conflictInfo.exists) {
        toInsert.push(session);
        continue;
      }

      const sessionHash = this.calculateSessionHash(session);

      if (conflictInfo.currentHash !== sessionHash) {
        toUpdate.push(session);
      } else {
        toSkip.push(session);
      }
    }

    return { toInsert, toUpdate, toSkip };
  }

  private calculateSessionHash(session: DatabaseSession): string {
    const crypto = require('node:crypto');
    const content = [
      session.ended_at?.toISOString() || '',
      session.duration_seconds?.toString() || '',
      session.total_input_tokens?.toString() || '',
      session.total_output_tokens?.toString() || '',
      session.total_cost_usd?.toString() || '',
    ].join('');

    return crypto.createHash('md5').update(content).digest('hex');
  }
}
