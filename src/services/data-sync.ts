import { DatabaseConnection } from '../database/connection.js';
import { DatabaseInserter } from '../database/inserter.js';
import { JSONLParser } from '../parsers/jsonl-parser.js';
import type { FileInfo, ParsedSessionData, ParseError } from '../types/index.js';
import { FileDiscoveryService } from '../utils/file-discovery.js';

export interface SyncOptions {
  dryRun?: boolean;
  maxFiles?: number;
  skipExisting?: boolean;
  incremental?: boolean;
  forceFullSync?: boolean;
}

export interface SyncResult {
  success: boolean;
  summary: {
    filesProcessed: number;
    newFiles: number;
    updatedFiles: number;
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
    filesDiscovered: FileInfo[];
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
  private fileDiscovery: FileDiscoveryService;

  constructor(db?: DatabaseConnection, claudeDataDir?: string) {
    this.db = db || DatabaseConnection.getInstance();
    this.parser = new JSONLParser();
    this.inserter = new DatabaseInserter(this.db);
    this.fileDiscovery = new FileDiscoveryService(claudeDataDir);
  }

  async syncAllData(options: SyncOptions = {}): Promise<SyncResult> {
    if (options.incremental && !options.forceFullSync) {
      return await this.syncIncrementalData(options);
    }

    const startTime = new Date();

    const result: SyncResult = {
      success: false,
      summary: {
        filesProcessed: 0,
        newFiles: 0,
        updatedFiles: 0,
        sessionsInserted: 0,
        messagesInserted: 0,
        metricsInserted: 0,
        duplicatesSkipped: 0,
        errors: 0,
      },
      details: {
        successful: [],
        failed: [],
        insertionErrors: [],
        filesDiscovered: [],
      },
      timing: {
        startTime,
        endTime: new Date(),
        durationMs: 0,
      },
    };

    try {
      console.log('🚀 Starting full data sync...');

      // Mark sync as in progress
      await this.inserter.upsertSyncMetadata({
        sync_key: 'global',
        last_sync_timestamp: startTime,
        files_processed: 0,
        sessions_processed: 0,
        sync_status: 'in_progress',
        error_message: undefined,
      });

      // Parse all JSONL files
      const parseResult = await this.parser.parseAllSessions();

      result.details.successful = parseResult.successful;
      result.details.failed = parseResult.failed;
      result.summary.filesProcessed = parseResult.successful.length + parseResult.failed.length;
      result.summary.errors = parseResult.failed.length;

      console.log(
        `📊 Parsing complete: ${parseResult.successful.length} successful, ${parseResult.failed.length} failed`,
      );

      if (parseResult.successful.length === 0) {
        console.log('⚠️ No valid session data found to sync');
        result.timing.endTime = new Date();
        result.timing.durationMs = result.timing.endTime.getTime() - startTime.getTime();
        return result;
      }

      // Filter out existing sessions if skipExisting is true
      let sessionsToInsert = parseResult.successful;

      if (options.skipExisting) {
        const sessionIds = parseResult.successful.map((s) => s.session.session_id);
        const existingIds = await this.inserter.checkForDuplicates(sessionIds);

        if (existingIds.length > 0) {
          sessionsToInsert = parseResult.successful.filter(
            (s) => !existingIds.includes(s.session.session_id),
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
          (sum, s) => sum + s.messages.length,
          0,
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
            sessionId: (error.data as any)?.['session_id'] || 'unknown',
            error: error.error,
          });
        }

        result.success = insertionResult.success;

        console.log(
          `✅ Insertion complete: ${result.summary.sessionsInserted} sessions, ${result.summary.messagesInserted} messages`,
        );
      }

      // Update sync metadata on success
      if (result.success || result.details.insertionErrors.length === 0) {
        await this.inserter.upsertSyncMetadata({
          sync_key: 'global',
          last_sync_timestamp: result.timing.endTime,
          files_processed: result.summary.filesProcessed,
          sessions_processed: result.summary.sessionsInserted,
          sync_status: 'completed',
          error_message: undefined,
        });
      } else {
        await this.inserter.upsertSyncMetadata({
          sync_key: 'global',
          last_sync_timestamp: result.timing.endTime,
          files_processed: result.summary.filesProcessed,
          sessions_processed: result.summary.sessionsInserted,
          sync_status: 'failed',
          error_message: `${result.details.insertionErrors.length} insertion errors occurred`,
        });
      }
    } catch (error) {
      console.error('💥 Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      result.details.insertionErrors.push({
        sessionId: 'sync_process',
        error: errorMessage,
      });

      // Update sync metadata with error
      await this.inserter.upsertSyncMetadata({
        sync_key: 'global',
        last_sync_timestamp: startTime,
        files_processed: result.summary.filesProcessed,
        sessions_processed: result.summary.sessionsInserted,
        sync_status: 'failed',
        error_message: errorMessage,
      });
    }

    result.timing.endTime = new Date();
    result.timing.durationMs = result.timing.endTime.getTime() - startTime.getTime();

    console.log(`⏱️ Sync completed in ${result.timing.durationMs}ms`);

    return result;
  }

  async syncIncrementalData(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = new Date();

    const result: SyncResult = {
      success: false,
      summary: {
        filesProcessed: 0,
        newFiles: 0,
        updatedFiles: 0,
        sessionsInserted: 0,
        messagesInserted: 0,
        metricsInserted: 0,
        duplicatesSkipped: 0,
        errors: 0,
      },
      details: {
        successful: [],
        failed: [],
        insertionErrors: [],
        filesDiscovered: [],
      },
      timing: {
        startTime,
        endTime: new Date(),
        durationMs: 0,
      },
    };

    try {
      console.log('🔄 Starting incremental data sync...');

      // Get last sync timestamp
      const lastSyncTimestamp = await this.inserter.getLastSyncTimestamp();

      if (lastSyncTimestamp) {
        console.log(`📅 Last sync: ${lastSyncTimestamp.toISOString()}`);
      } else {
        console.log('🆕 No previous sync found - performing full sync');
        return await this.syncAllData({ ...options, forceFullSync: true });
      }

      // Discover new and updated files
      const fileDiscoveryResult =
        await this.fileDiscovery.findNewAndUpdatedFiles(lastSyncTimestamp);

      result.details.filesDiscovered = fileDiscoveryResult.allFiles;
      result.summary.newFiles = fileDiscoveryResult.newFiles.length;
      result.summary.updatedFiles = fileDiscoveryResult.updatedFiles.length;

      const filesToProcess = [...fileDiscoveryResult.newFiles, ...fileDiscoveryResult.updatedFiles];

      if (filesToProcess.length === 0) {
        console.log('✨ No new or updated files found');
        result.success = true;
        result.timing.endTime = new Date();
        result.timing.durationMs = result.timing.endTime.getTime() - startTime.getTime();
        return result;
      }

      console.log(
        `📁 Found ${fileDiscoveryResult.newFiles.length} new and ${fileDiscoveryResult.updatedFiles.length} updated files`,
      );

      // Limit files if specified
      let filesToSync = filesToProcess;
      if (options.maxFiles && options.maxFiles > 0) {
        filesToSync = filesToProcess.slice(0, options.maxFiles);
        console.log(`🔢 Limited to ${options.maxFiles} files`);
      }

      // Process each file
      const filePaths = filesToSync.map((file) => file.path);
      const specificFilesResult = await this.syncSpecificFiles(filePaths, options);

      // Merge results
      result.summary.filesProcessed = specificFilesResult.summary.filesProcessed;
      result.summary.sessionsInserted = specificFilesResult.summary.sessionsInserted;
      result.summary.messagesInserted = specificFilesResult.summary.messagesInserted;
      result.summary.metricsInserted = specificFilesResult.summary.metricsInserted;
      result.summary.duplicatesSkipped = specificFilesResult.summary.duplicatesSkipped;
      result.summary.errors = specificFilesResult.summary.errors;

      result.details.successful = specificFilesResult.details.successful;
      result.details.failed = specificFilesResult.details.failed;
      result.details.insertionErrors = specificFilesResult.details.insertionErrors;
      result.success = specificFilesResult.success;

      // Update sync metadata
      if (result.success) {
        await this.inserter.upsertSyncMetadata({
          sync_key: 'global',
          last_sync_timestamp: result.timing.endTime,
          files_processed: result.summary.filesProcessed,
          sessions_processed: result.summary.sessionsInserted,
          sync_status: 'completed',
          error_message: undefined,
        });
      }

      console.log(
        `✅ Incremental sync complete: ${result.summary.newFiles} new, ${result.summary.updatedFiles} updated files`,
      );
    } catch (error) {
      console.error('💥 Incremental sync failed:', error);
      result.details.insertionErrors.push({
        sessionId: 'incremental_sync_process',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    result.timing.endTime = new Date();
    result.timing.durationMs = result.timing.endTime.getTime() - startTime.getTime();

    console.log(`⏱️ Incremental sync completed in ${result.timing.durationMs}ms`);

    return result;
  }

  async syncSpecificFiles(filePaths: string[], options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = new Date();

    const result: SyncResult = {
      success: false,
      summary: {
        filesProcessed: filePaths.length,
        newFiles: 0,
        updatedFiles: 0,
        sessionsInserted: 0,
        messagesInserted: 0,
        metricsInserted: 0,
        duplicatesSkipped: 0,
        errors: 0,
      },
      details: {
        successful: [],
        failed: [],
        insertionErrors: [],
        filesDiscovered: [],
      },
      timing: {
        startTime,
        endTime: new Date(),
        durationMs: 0,
      },
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
              errors: parseResult.errors,
            });
            result.summary.errors++;
          }
        } catch (error) {
          result.details.failed.push({
            filePath,
            errors: [
              {
                file_path: filePath,
                error_type: 'FILE_ACCESS',
                message: error instanceof Error ? error.message : 'Unknown error',
              },
            ],
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
            sessionId: (error.data as any)?.['session_id'] || 'unknown',
            error: error.error,
          });
        }

        result.success = insertionResult.success;
      } else if (options.dryRun) {
        result.summary.sessionsInserted = result.details.successful.length;
        result.summary.messagesInserted = result.details.successful.reduce(
          (sum, s) => sum + s.messages.length,
          0,
        );
        result.summary.metricsInserted = result.details.successful.length;
        result.success = true;
      }
    } catch (error) {
      console.error('💥 File sync failed:', error);
      result.details.insertionErrors.push({
        sessionId: 'file_sync_process',
        error: error instanceof Error ? error.message : 'Unknown error',
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

  async getSyncStatus() {
    const syncMetadata = await this.inserter.getSyncMetadata('global');
    const fileStats = await this.fileDiscovery.getFileStats();
    const sessionStats = await this.inserter.getSessionStats();

    return {
      lastSync: syncMetadata,
      fileSystem: fileStats,
      database: sessionStats,
      isHealthy: await this.db.testConnection(),
    };
  }

  async previewIncrementalSync(): Promise<{
    newFiles: FileInfo[];
    updatedFiles: FileInfo[];
    estimatedSessions: number;
  }> {
    const lastSyncTimestamp = await this.inserter.getLastSyncTimestamp();

    if (!lastSyncTimestamp) {
      const allFiles = await this.fileDiscovery.findClaudeCodeFiles();
      return {
        newFiles: allFiles,
        updatedFiles: [],
        estimatedSessions: allFiles.length,
      };
    }

    const fileDiscoveryResult = await this.fileDiscovery.findNewAndUpdatedFiles(lastSyncTimestamp);

    return {
      newFiles: fileDiscoveryResult.newFiles,
      updatedFiles: fileDiscoveryResult.updatedFiles,
      estimatedSessions:
        fileDiscoveryResult.newFiles.length + fileDiscoveryResult.updatedFiles.length,
    };
  }

  async forceSyncMetadataReset(): Promise<void> {
    console.log('🔄 Resetting sync metadata...');
    await this.inserter.upsertSyncMetadata({
      sync_key: 'global',
      last_sync_timestamp: new Date(0), // Unix epoch
      files_processed: 0,
      sessions_processed: 0,
      sync_status: 'completed',
      error_message: undefined,
    });
    console.log('✅ Sync metadata reset - next sync will be full sync');
  }
}
