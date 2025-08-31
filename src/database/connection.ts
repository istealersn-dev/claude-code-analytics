import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PoolClient, QueryResult } from 'pg';
import { Pool } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 5000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      throw new Error('Database connection lost');
    });
  }

  public static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      if (!config) {
        throw new Error('Database configuration is required for first initialization');
      }
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  public static getDefaultConfig(): DatabaseConfig {
    return {
      host: process.env['DB_HOST'] || 'localhost',
      port: Number.parseInt(process.env['DB_PORT'] || '5432', 10),
      database: process.env['DB_NAME'] || 'claude_code_analytics',
      user: process.env['DB_USER'] || process.env['USER'] || 'postgres',
      password: process.env['DB_PASSWORD'],
      ssl: process.env['NODE_ENV'] === 'production',
      max: Number.parseInt(process.env['DB_POOL_SIZE'] || '20', 10),
      idleTimeoutMillis: Number.parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000', 10),
      connectionTimeoutMillis: Number.parseInt(process.env['DB_CONNECTION_TIMEOUT'] || '5000', 10),
    };
  }

  public async query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      if (process.env['NODE_ENV'] === 'development') {
        console.log(`Query executed in ${duration}ms:`, text.substring(0, 100));
      }

      return result;
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query<{ current_time: Date; version: string }>(
        'SELECT NOW() as current_time, version() as version',
      );
      console.log('✅ Database connection successful');
      console.log('📅 Server time:', result.rows[0]?.current_time);
      console.log('🔧 PostgreSQL version:', result.rows[0]?.version.split(',')[0]);
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  public async initializeSchema(): Promise<void> {
    const schemaPath = path.join(process.cwd(), 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    try {
      await this.query(schemaSql);
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database schema:', error);
      throw error;
    }
  }

  public async getStats(): Promise<{
    totalConnections: number;
    idleConnections: number;
    waitingConnections: number;
  }> {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingConnections: this.pool.waitingCount,
    };
  }

  public async close(): Promise<void> {
    await this.pool.end();
    console.log('🔌 Database connection pool closed');
  }

  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      poolStats: {
        totalConnections: number;
        idleConnections: number;
        waitingConnections: number;
      };
      latency?: number;
    };
  }> {
    try {
      const start = Date.now();
      await this.query('SELECT 1');
      const latency = Date.now() - start;

      const poolStats = await this.getStats();

      return {
        status: 'healthy',
        details: {
          connected: true,
          poolStats,
          latency,
        },
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          poolStats: await this.getStats(),
        },
      };
    }
  }
}

export function createDatabaseConnection(config?: DatabaseConfig): DatabaseConnection {
  const dbConfig = config || DatabaseConnection.getDefaultConfig();
  return DatabaseConnection.getInstance(dbConfig);
}
