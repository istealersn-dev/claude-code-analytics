import { JSONLParser } from '../parsers/jsonl-parser.js';
import { DatabaseInserter, InsertionResult } from '../database/inserter.js';
import { DatabaseConnection } from '../database/connection.js';
import { ParsedSessionData, ParseError } from '../types/index.js';

export interface SyncOptions {
  dryRun?: boolean;
  maxFiles?: number;
  skipExisting?: boolean;
}

export interface SyncResult {
  success: boolean;
  summary: {
    filesProcessed: number;
    sessionsInserted: number;
    messagesInserted: number;
    metricsInserted: number;
    duplicatesSkipped: number;
    errors: number;
  };
  details: {
    successful: ParsedSessionData[];
    failed: Array<{
      filePath: string;
      errors: ParseError[];
    }>;
    insertionErrors: Array<{
      sessionId: string;
      error: string;
    }>;
  };
  timing: {
    startTime: Date;
    endTime: Date;
    durationMs: number;
  };
}

export class DataSyncService {
  private parser: JSONLParser;
  private inserter: DatabaseInserter;
  private db: DatabaseConnection;

  constructor(db?: DatabaseConnection) {
    this.db = db || DatabaseConnection.getInstance();
    this.parser = new JSONLParser();
    this.inserter = new DatabaseInserter(this.db);
  }

  async syncAllData(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = new Date();
    
    const result: SyncResult = {
      success: false,
      summary: {
        filesProcessed: 0,
        sessionsInserted: 0,
        messagesInserted: 0,
        metricsInserted: 0,
        duplicatesSkipped: 0,
        errors: 0
      },
      details: {
        successful: [],
        failed: [],
        insertionErrors: []
      },
      timing: {
        startTime,
        endTime: new Date(),
        durationMs: 0
      }
    };

    try {
      console.log('🚀 Starting data sync...');
      
      // Parse all JSONL files
      const parseResult = await this.parser.parseAllSessions();
      
      result.details.successful = parseResult.successful;
      result.details.failed = parseResult.failed;
      result.summary.filesProcessed = parseResult.successful.length + parseResult.failed.length;
      result.summary.errors = parseResult.failed.length;

      console.log(`📊 Parsing complete: ${parseResult.successful.length} successful, ${parseResult.failed.length} failed`);

      if (parseResult.successful.length === 0) {
        console.log('⚠️ No valid session data found to sync');
        result.timing.endTime = new Date();
        result.timing.durationMs = result.timing.endTime.getTime() - startTime.getTime();
        return result;
      }

      // Filter out existing sessions if skipExisting is true
      let sessionsToInsert = parseResult.successful;
      
      if (options.skipExisting) {
        const sessionIds = parseResult.successful.map(s => s.session.session_id);
        const existingIds = await this.inserter.checkForDuplicates(sessionIds);
        
        if (existingIds.length > 0) {
          sessionsToInsert = parseResult.successful.filter(
            s => !existingIds.includes(s.session.session_id)
          );
          result.summary.duplicatesSkipped = existingIds.length;
          console.log(`⏭️ Skipping ${existingIds.length} existing sessions`);
        }
      }

      // Limit files if specified
      if (options.maxFiles && options.maxFiles > 0) {
        sessionsToInsert = sessionsToInsert.slice(0, options.maxFiles);
        console.log(`🔢 Limited to ${options.maxFiles} files`);
      }

      if (options.dryRun) {
        console.log('🧪 Dry run mode - no data will be inserted');
        result.summary.sessionsInserted = sessionsToInsert.length;
        result.summary.messagesInserted = sessionsToInsert.reduce(
          (sum, s) => sum + s.messages.length, 0
        );
        result.summary.metricsInserted = sessionsToInsert.length;
        result.success = true;
      } else {
        // Insert data in batches
        console.log(`💾 Inserting ${sessionsToInsert.length} sessions...`);
        
        const insertionResult = await this.inserter.batchInsertSessions(sessionsToInsert);
        
        result.summary.sessionsInserted = insertionResult.inserted.sessions;
        result.summary.messagesInserted = insertionResult.inserted.messages;
        result.summary.metricsInserted = insertionResult.inserted.metrics;
        result.summary.duplicatesSkipped += insertionResult.duplicatesSkipped;

        // Track insertion errors
        for (const error of insertionResult.errors) {
          result.details.insertionErrors.push({
            sessionId: error.data?.session_id || 'unknown',
            error: error.error
          });
        }

        result.success = insertionResult.success;
        
        console.log(`✅ Insertion complete: ${result.summary.sessionsInserted} sessions, ${result.summary.messagesInserted} messages`);
      }

    } catch (error) {
      console.error('💥 Sync failed:', error);
      result.details.insertionErrors.push({
        sessionId: 'sync_process',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    result.timing.endTime = new Date();
    result.timing.durationMs = result.timing.endTime.getTime() - startTime.getTime();

    console.log(`⏱️ Sync completed in ${result.timing.durationMs}ms`);
    
    return result;
  }

  async syncSpecificFiles(filePaths: string[], options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = new Date();
    
    const result: SyncResult = {
      success: false,
      summary: {
        filesProcessed: filePaths.length,
        sessionsInserted: 0,
        messagesInserted: 0,
        metricsInserted: 0,
        duplicatesSkipped: 0,
        errors: 0
      },
      details: {
        successful: [],
        failed: [],
        insertionErrors: []
      },
      timing: {
        startTime,
        endTime: new Date(),
        durationMs: 0
      }
    };

    try {
      console.log(`🎯 Syncing ${filePaths.length} specific files...`);

      // Parse each file
      for (const filePath of filePaths) {
        try {
          const parseResult = await this.parser.parseSessionFile(filePath);
          
          if (parseResult.success && parseResult.data) {
            result.details.successful.push(parseResult.data);
          } else {
            result.details.failed.push({
              filePath,
              errors: parseResult.errors
            });
            result.summary.errors++;
          }
        } catch (error) {
          result.details.failed.push({
            filePath,
            errors: [{
              file_path: filePath,
              error_type: 'FILE_ACCESS',
              message: error instanceof Error ? error.message : 'Unknown error'
            }]
          });
          result.summary.errors++;
        }
      }

      if (!options.dryRun && result.details.successful.length > 0) {
        // Insert the parsed sessions
        const insertionResult = await this.inserter.batchInsertSessions(result.details.successful);
        
        result.summary.sessionsInserted = insertionResult.inserted.sessions;
        result.summary.messagesInserted = insertionResult.inserted.messages;
        result.summary.metricsInserted = insertionResult.inserted.metrics;
        result.summary.duplicatesSkipped = insertionResult.duplicatesSkipped;

        for (const error of insertionResult.errors) {
          result.details.insertionErrors.push({
            sessionId: error.data?.session_id || 'unknown',
            error: error.error
          });
        }

        result.success = insertionResult.success;
      } else if (options.dryRun) {
        result.summary.sessionsInserted = result.details.successful.length;
        result.summary.messagesInserted = result.details.successful.reduce(
          (sum, s) => sum + s.messages.length, 0
        );
        result.summary.metricsInserted = result.details.successful.length;
        result.success = true;
      }

    } catch (error) {
      console.error('💥 File sync failed:', error);
      result.details.insertionErrors.push({
        sessionId: 'file_sync_process',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    result.timing.endTime = new Date();
    result.timing.durationMs = result.timing.endTime.getTime() - startTime.getTime();

    return result;
  }

  async getDataStats() {
    return await this.inserter.getSessionStats();
  }

  async cleanupOldData(retentionDays: number = 90): Promise<number> {
    console.log(`🧹 Cleaning up data older than ${retentionDays} days...`);
    const deletedCount = await this.inserter.cleanupOldData(retentionDays);
    console.log(`🗑️ Deleted ${deletedCount} old sessions`);
    return deletedCount;
  }

  async testConnection(): Promise<boolean> {
    return await this.db.testConnection();
  }

  async healthCheck() {
    return await this.db.healthCheck();
  }
}