import { DatabaseConnection } from './connection.js';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
  timestamp: Date;
}

export interface MigrationRecord {
  id: string;
  name: string;
  applied_at: Date;
  batch: number;
}

export interface MigrationStatus {
  applied: MigrationRecord[];
  pending: Migration[];
  total: number;
  appliedCount: number;
  pendingCount: number;
}

export class MigrationManager {
  private db: DatabaseConnection;
  private migrationsPath: string;

  constructor(db?: DatabaseConnection, migrationsPath?: string) {
    this.db = db || DatabaseConnection.getInstance();
    this.migrationsPath = migrationsPath || join(process.cwd(), 'migrations');
  }

  private async ensureMigrationsTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        batch INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_migrations_batch ON migrations(batch);
      CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON migrations(applied_at);
    `;

    await this.db.query(createTableQuery);
  }

  private async getNextBatchNumber(): Promise<number> {
    const result = await this.db.query(
      'SELECT COALESCE(MAX(batch), 0) + 1 as next_batch FROM migrations'
    );
    return result.rows[0].next_batch;
  }

  private async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.db.query(
      'SELECT id, name, applied_at, batch FROM migrations ORDER BY applied_at ASC'
    );
    return result.rows;
  }

  private async getMigrationFiles(): Promise<Migration[]> {
    try {
      await fs.access(this.migrationsPath);
    } catch {
      console.warn(`⚠️ Migrations directory not found: ${this.migrationsPath}`);
      return [];
    }

    const files = await fs.readdir(this.migrationsPath);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql') || file.endsWith('.js') || file.endsWith('.ts'))
      .sort();

    const migrations: Migration[] = [];

    for (const file of migrationFiles) {
      const filePath = join(this.migrationsPath, file);
      const migration = await this.parseMigrationFile(filePath, file);
      if (migration) {
        migrations.push(migration);
      }
    }

    return migrations;
  }

  private async parseMigrationFile(filePath: string, fileName: string): Promise<Migration | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (fileName.endsWith('.sql')) {
        return this.parseSQLMigration(content, fileName);
      } else if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
        return this.parseJSMigration(filePath, fileName);
      }

      return null;
    } catch (error) {
      console.error(`❌ Failed to parse migration file ${fileName}:`, error);
      return null;
    }
  }

  private parseSQLMigration(content: string, fileName: string): Migration {
    // Extract timestamp and name from filename (format: YYYYMMDDHHMMSS_name.sql)
    const match = fileName.match(/^(\d{14})_(.+)\.sql$/);
    const id = match?.[1] ?? fileName.replace('.sql', '');
    const name = match?.[2]?.replace(/_/g, ' ') ?? fileName.replace('.sql', '');
    
    // Split content by -- DOWN marker
    const parts = content.split(/^\s*--\s*DOWN\s*$/mi);
    const up = parts[0]?.trim() ?? '';
    const down = parts[1]?.trim() ?? '';
    
    // Parse timestamp from ID or use current time
    let timestamp: Date;
    if (match && id) {
      const year = parseInt(id.substring(0, 4));
      const month = parseInt(id.substring(4, 6)) - 1;
      const day = parseInt(id.substring(6, 8));
      const hour = parseInt(id.substring(8, 10));
      const minute = parseInt(id.substring(10, 12));
      const second = parseInt(id.substring(12, 14));
      timestamp = new Date(year, month, day, hour, minute, second);
    } else {
      timestamp = new Date();
    }

    return { id, name, up, down, timestamp };
  }

  private async parseJSMigration(filePath: string, fileName: string): Promise<Migration> {
    // For JS/TS migrations, we would import and execute
    // This is a simplified version - in practice you'd use dynamic imports
    const match = fileName.match(/^(\d{14})_(.+)\.(js|ts)$/);
    const id = match?.[1] ?? fileName.replace(/\.(js|ts)$/, '');
    const name = match?.[2]?.replace(/_/g, ' ') ?? fileName.replace(/\.(js|ts)$/, '');

    let timestamp: Date;
    if (match && id) {
      const year = parseInt(id.substring(0, 4));
      const month = parseInt(id.substring(4, 6)) - 1;
      const day = parseInt(id.substring(6, 8));
      const hour = parseInt(id.substring(8, 10));
      const minute = parseInt(id.substring(10, 12));
      const second = parseInt(id.substring(12, 14));
      timestamp = new Date(year, month, day, hour, minute, second);
    } else {
      timestamp = new Date();
    }

    return {
      id,
      name,
      up: `-- JavaScript migration: ${filePath}`,
      down: `-- JavaScript rollback: ${filePath}`,
      timestamp
    };
  }

  async getStatus(): Promise<MigrationStatus> {
    await this.ensureMigrationsTable();
    
    const [applied, allMigrations] = await Promise.all([
      this.getAppliedMigrations(),
      this.getMigrationFiles()
    ]);

    const appliedIds = new Set(applied.map(m => m.id));
    const pending = allMigrations.filter(m => !appliedIds.has(m.id));

    return {
      applied,
      pending,
      total: allMigrations.length,
      appliedCount: applied.length,
      pendingCount: pending.length
    };
  }

  async runPending(): Promise<{
    success: boolean;
    applied: Migration[];
    errors: Array<{ migration: Migration; error: string }>;
  }> {
    console.log('🚀 Running pending migrations...');
    
    await this.ensureMigrationsTable();
    const status = await this.getStatus();
    
    if (status.pendingCount === 0) {
      console.log('✨ No pending migrations found');
      return { success: true, applied: [], errors: [] };
    }

    const batch = await this.getNextBatchNumber();
    const applied: Migration[] = [];
    const errors: Array<{ migration: Migration; error: string }> = [];

    for (const migration of status.pending) {
      try {
        console.log(`📋 Applying migration: ${migration.name} (${migration.id})`);
        
        await this.db.transaction(async (client) => {
          // Run the migration
          await client.query(migration.up);
          
          // Record the migration
          await client.query(
            'INSERT INTO migrations (id, name, batch) VALUES ($1, $2, $3)',
            [migration.id, migration.name, batch]
          );
        });

        applied.push(migration);
        console.log(`✅ Applied migration: ${migration.name}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to apply migration ${migration.name}:`, errorMessage);
        errors.push({ migration, error: errorMessage });
        
        // Stop on first error to maintain consistency
        break;
      }
    }

    const success = errors.length === 0;
    
    if (success) {
      console.log(`🎉 Successfully applied ${applied.length} migrations`);
    } else {
      console.log(`⚠️ Applied ${applied.length} migrations with ${errors.length} errors`);
    }

    return { success, applied, errors };
  }

  async rollback(steps: number = 1): Promise<{
    success: boolean;
    rolledBack: MigrationRecord[];
    errors: Array<{ migration: MigrationRecord; error: string }>;
  }> {
    console.log(`🔄 Rolling back ${steps} migration(s)...`);
    
    await this.ensureMigrationsTable();
    
    // Get the last applied migrations
    const result = await this.db.query(
      'SELECT id, name, applied_at, batch FROM migrations ORDER BY applied_at DESC LIMIT $1',
      [steps]
    );

    const migrationsToRollback: MigrationRecord[] = result.rows;
    
    if (migrationsToRollback.length === 0) {
      console.log('✨ No migrations to rollback');
      return { success: true, rolledBack: [], errors: [] };
    }

    // Get migration files to find the down scripts
    const allMigrations = await this.getMigrationFiles();
    const migrationMap = new Map(allMigrations.map(m => [m.id, m]));

    const rolledBack: MigrationRecord[] = [];
    const errors: Array<{ migration: MigrationRecord; error: string }> = [];

    for (const appliedMigration of migrationsToRollback) {
      const migrationFile = migrationMap.get(appliedMigration.id);
      
      if (!migrationFile) {
        errors.push({
          migration: appliedMigration,
          error: `Migration file not found for ${appliedMigration.id}`
        });
        continue;
      }

      try {
        console.log(`📋 Rolling back migration: ${appliedMigration.name} (${appliedMigration.id})`);
        
        await this.db.transaction(async (client) => {
          // Run the rollback
          if (migrationFile.down) {
            await client.query(migrationFile.down);
          }
          
          // Remove the migration record
          await client.query('DELETE FROM migrations WHERE id = $1', [appliedMigration.id]);
        });

        rolledBack.push(appliedMigration);
        console.log(`✅ Rolled back migration: ${appliedMigration.name}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to rollback migration ${appliedMigration.name}:`, errorMessage);
        errors.push({ migration: appliedMigration, error: errorMessage });
        
        // Stop on first error to maintain consistency
        break;
      }
    }

    const success = errors.length === 0;
    
    if (success) {
      console.log(`🎉 Successfully rolled back ${rolledBack.length} migrations`);
    } else {
      console.log(`⚠️ Rolled back ${rolledBack.length} migrations with ${errors.length} errors`);
    }

    return { success, rolledBack, errors };
  }

  async reset(): Promise<void> {
    console.log('🔄 Resetting all migrations...');
    
    await this.ensureMigrationsTable();
    
    const applied = await this.getAppliedMigrations();
    
    if (applied.length === 0) {
      console.log('✨ No migrations to reset');
      return;
    }

    await this.rollback(applied.length);
    console.log('🎉 All migrations reset');
  }

  async createMigration(name: string): Promise<string> {
    const timestamp = new Date();
    const id = timestamp
      .toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\.\d{3}Z$/, '');
    
    const fileName = `${id}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filePath = join(this.migrationsPath, fileName);

    const content = `-- Migration: ${name}
-- Created: ${timestamp.toISOString()}

-- UP
-- Add your migration SQL here


-- DOWN
-- Add your rollback SQL here

`;

    // Ensure migrations directory exists
    try {
      await fs.access(this.migrationsPath);
    } catch {
      await fs.mkdir(this.migrationsPath, { recursive: true });
    }

    await fs.writeFile(filePath, content);
    
    console.log(`✅ Created migration: ${fileName}`);
    return filePath;
  }
}