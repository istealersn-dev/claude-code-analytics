import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { DataSyncService } from '../../services/data-sync.js';

// TypeScript interfaces for request bodies
interface SyncRunBody {
  incremental?: boolean;
  dryRun?: boolean;
  maxFiles?: string | number;
  skipExisting?: boolean;
  forceFullSync?: boolean;
}

interface SyncFilesBody {
  filePaths: string[];
  dryRun?: boolean;
}

export const syncRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const syncService = new DataSyncService();
  // Get sync status
  app.get('/status', async (request, reply) => {
    const status = await syncService.getSyncStatus();
    
    return reply.send({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  });

  // Preview incremental sync (dry run)
  app.get('/preview', async (request, reply) => {
    const preview = await syncService.previewIncrementalSync();
    
    return reply.send({
      success: true,
      data: {
        newFiles: preview.newFiles.length,
        updatedFiles: preview.updatedFiles.length,
        estimatedSessions: preview.estimatedSessions,
        files: {
          new: preview.newFiles.map(file => ({
            path: file.path.split('/').pop(), // Just filename for privacy
            size: file.size,
            modifiedTime: file.modified_time
          })).slice(0, 10), // Limit for response size
          updated: preview.updatedFiles.map(file => ({
            path: file.path.split('/').pop(),
            size: file.size,
            modifiedTime: file.modified_time
          })).slice(0, 10)
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  // Run data sync
  app.post<{ Body: SyncRunBody }>('/run', async (request, reply) => {
    const {
      incremental = true,
      dryRun = false,
      maxFiles,
      skipExisting = false,
      forceFullSync = false
    } = request.body;

    // Validate parameters
    if (typeof incremental !== 'boolean') {
      return reply.status(400).send(app.httpErrors.badRequest('incremental must be a boolean'));
    }
    
    if (typeof dryRun !== 'boolean') {
      return reply.status(400).send(app.httpErrors.badRequest('dryRun must be a boolean'));
    }

    if (maxFiles !== undefined) {
      const maxFilesNum = parseInt(maxFiles as string);
      if (isNaN(maxFilesNum) || maxFilesNum < 1 || maxFilesNum > 1000) {
        return reply.status(400).send(app.httpErrors.badRequest('maxFiles must be a number between 1 and 1000'));
      }
    }

    console.log(`🚀 Starting ${incremental ? 'incremental' : 'full'} sync via API...`);

    const result = await syncService.syncAllData({
      incremental,
      dryRun,
      maxFiles: maxFiles ? parseInt(maxFiles as string) : undefined,
      skipExisting,
      forceFullSync
    });

    const statusCode = result.success ? 200 : 207; // 207 Multi-Status for partial success
    
    return reply.status(statusCode).send({
      success: result.success,
      data: {
        summary: result.summary,
        timing: {
          startTime: result.timing.startTime,
          endTime: result.timing.endTime,
          durationMs: result.timing.durationMs,
          durationHuman: `${(result.timing.durationMs / 1000).toFixed(2)}s`
        },
        errors: result.details.insertionErrors.length > 0 ? {
          count: result.details.insertionErrors.length,
          details: result.details.insertionErrors.slice(0, 10) // Limit error details
        } : undefined
      },
      timestamp: new Date().toISOString()
    });
  });

  // Run sync for specific files
  app.post<{ Body: SyncFilesBody }>('/files', async (request, reply) => {
    const { filePaths, dryRun = false } = request.body;

    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return reply.status(400).send(app.httpErrors.badRequest('filePaths must be a non-empty array'));
    }

    if (filePaths.length > 100) {
      return reply.status(400).send(app.httpErrors.badRequest('Cannot process more than 100 files at once'));
    }

    // Validate file paths
    const invalidPaths = filePaths.filter(path => 
      typeof path !== 'string' || 
      !path.endsWith('.jsonl') ||
      path.includes('..') // Basic security check
    );

    if (invalidPaths.length > 0) {
      return reply.status(400).send(app.httpErrors.badRequest(
        'Invalid file paths detected',
        { invalidPaths: invalidPaths.slice(0, 5) }
      ));
    }

    console.log(`🎯 Syncing ${filePaths.length} specific files via API...`);

    const result = await syncService.syncSpecificFiles(filePaths, { dryRun });

    const statusCode = result.success ? 200 : 207;
    
    return reply.status(statusCode).send({
      success: result.success,
      data: {
        summary: result.summary,
        timing: {
          startTime: result.timing.startTime,
          endTime: result.timing.endTime,
          durationMs: result.timing.durationMs,
          durationHuman: `${(result.timing.durationMs / 1000).toFixed(2)}s`
        },
        processedFiles: filePaths.length,
        errors: result.details.insertionErrors.length > 0 ? {
          count: result.details.insertionErrors.length,
          details: result.details.insertionErrors.slice(0, 10)
        } : undefined
      },
      timestamp: new Date().toISOString()
    });
  });

  // Reset sync metadata (force next sync to be full)
  app.post('/reset', async (request, reply) => {
    console.log('🔄 Resetting sync metadata via API...');
    
    await syncService.forceSyncMetadataReset();
    
    return reply.send({
      success: true,
      message: 'Sync metadata reset successfully. Next sync will be a full sync.',
      timestamp: new Date().toISOString()
    });
  });

  // Get data statistics
  app.get('/stats', async (request, reply) => {
    const stats = await syncService.getDataStats();
    
    return reply.send({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  });
};