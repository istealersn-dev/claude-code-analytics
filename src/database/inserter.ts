import { PoolClient } from 'pg';
import { DatabaseConnection } from './connection.js';
import { 
  DatabaseSession, 
  DatabaseMessage, 
  SessionMetrics, 
  ParsedSessionData 
} from '../types/index.js';

export interface InsertionResult {
  success: boolean;
  inserted: {
    sessions: number;
    messages: number;
    metrics: number;
  };
  errors: Array<{
    type: 'session' | 'message' | 'metric';
    data: any;
    error: string;
  }>;
  duplicatesSkipped: number;
}

export class DatabaseInserter {
  private db: DatabaseConnection;

  constructor(db?: DatabaseConnection) {
    this.db = db || DatabaseConnection.getInstance();
  }

  async insertSessionData(sessionData: ParsedSessionData): Promise<InsertionResult> {
    const result: InsertionResult = {
      success: false,
      inserted: { sessions: 0, messages: 0, metrics: 0 },
      errors: [],
      duplicatesSkipped: 0
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
          data: sessionData.session,
          error: error instanceof Error ? error.message : 'Unknown error'
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
      duplicatesSkipped: 0
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
            data: sessionData.session,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.errors.length === 0;
      return result;
    });
  }

  private async insertSessionDataInTransaction(
    client: PoolClient, 
    sessionData: ParsedSessionData
  ): Promise<InsertionResult> {
    const result: InsertionResult = {
      success: false,
      inserted: { sessions: 0, messages: 0, metrics: 0 },
      errors: [],
      duplicatesSkipped: 0
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
    session: DatabaseSession
  ): Promise<{ inserted: boolean; sessionId?: string }> {
    const insertQuery = `
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

    const values = [
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
      session.cache_miss_count
    ];

    const result = await client.query(insertQuery, values);
    const row = result.rows[0];
    
    return {
      inserted: row.inserted,
      sessionId: row.id
    };
  }

  private async batchInsertMessages(
    client: PoolClient, 
    messages: DatabaseMessage[]
  ): Promise<{ inserted: number; errors: any[] }> {
    const errors: any[] = [];
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
        ) VALUES ${batch.map((_, idx) => 
          `($${idx * 12 + 1}, $${idx * 12 + 2}, $${idx * 12 + 3}, $${idx * 12 + 4}, $${idx * 12 + 5}, 
           $${idx * 12 + 6}, $${idx * 12 + 7}, $${idx * 12 + 8}, $${idx * 12 + 9}, $${idx * 12 + 10}, 
           $${idx * 12 + 11}, $${idx * 12 + 12})`
        ).join(', ')}
      `;

      const values = batch.flatMap(msg => [
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
        msg.processing_time_ms
      ]);

      try {
        const result = await client.query(insertQuery, values);
        inserted += result.rowCount || 0;
      } catch (error) {
        errors.push({
          type: 'message',
          data: batch,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { inserted, errors };
  }

  private async insertOrUpdateMetrics(
    client: PoolClient, 
    metrics: SessionMetrics
  ): Promise<{ inserted: boolean }> {
    // Get session UUID
    const sessionIdQuery = 'SELECT id FROM sessions WHERE session_id = $1';
    const sessionResult = await client.query(sessionIdQuery, [metrics.session_id]);
    
    if (sessionResult.rows.length === 0) {
      throw new Error(`Session not found: ${metrics.session_id}`);
    }

    const sessionUuid = sessionResult.rows[0].id;

    const insertQuery = `
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

    const values = [
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
      metrics.cache_efficiency
    ];

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

    const result = await this.db.query(query, [sessionIds]);
    return result.rows.map(row => row.session_id);
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

    const result = await this.db.query(query);
    const row = result.rows[0];

    return {
      totalSessions: parseInt(row.total_sessions),
      totalMessages: parseInt(row.total_messages),
      totalCost: parseFloat(row.total_cost),
      dateRange: {
        earliest: row.earliest_session,
        latest: row.latest_session
      }
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
}