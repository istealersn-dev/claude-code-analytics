import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DataRetentionManager, RetentionConfig } from '../../database/retention.js';

// TypeScript interfaces for request parameters
interface RetentionStatsQuery {
  sessionRetentionDays?: string;
  messageRetentionDays?: string;
}

interface OldestRecordsQuery {
  limit?: string;
}

interface CleanupRequestBody {
  sessionRetentionDays?: number;
  messageRetentionDays?: number;
  metricsRetentionDays?: number;
  syncMetadataRetentionDays?: number;
  batchSize?: number;
  dryRun?: boolean;
}

interface ScheduleRequestBody {
  cronExpression?: string;
}

export async function retentionRoutes(app: FastifyInstance) {
  const retentionManager = new DataRetentionManager();
  // Get retention statistics
  app.get<{
    Querystring: RetentionStatsQuery;
  }>('/stats', async (request: FastifyRequest<{ Querystring: RetentionStatsQuery }>, reply: FastifyReply) => {
    const config: Partial<RetentionConfig> = {};

    // Parse optional config parameters
    if (request.query.sessionRetentionDays) {
      const days = parseInt(request.query.sessionRetentionDays);
      if (isNaN(days) || days < 1 || days > 3650) {
        throw app.httpErrors.badRequest('sessionRetentionDays must be between 1 and 3650');
      }
      config.sessionRetentionDays = days;
    }

    if (request.query.messageRetentionDays) {
      const days = parseInt(request.query.messageRetentionDays);
      if (isNaN(days) || days < 1 || days > 3650) {
        throw app.httpErrors.badRequest('messageRetentionDays must be between 1 and 3650');
      }
      config.messageRetentionDays = days;
    }

    const stats = await retentionManager.getRetentionStats(config);
    
    return reply.send({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  });

  // Get oldest records
  app.get<{
    Querystring: OldestRecordsQuery;
  }>('/oldest', async (request: FastifyRequest<{ Querystring: OldestRecordsQuery }>, reply: FastifyReply) => {
    const limit = request.query.limit ? parseInt(request.query.limit) : 10;
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw app.httpErrors.badRequest('limit must be between 1 and 100');
    }
    
    const oldestRecords = await retentionManager.getOldestRecords(limit);
    
    return reply.send({
      success: true,
      data: oldestRecords,
      timestamp: new Date().toISOString()
    });
  });

  // Validate retention policy
  app.get('/validate', async (request: FastifyRequest, reply: FastifyReply) => {
    const validation = await retentionManager.validateRetentionPolicy();
    
    return reply.send({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    });
  });

  // Run data cleanup
  app.post<{
    Body: CleanupRequestBody;
  }>('/clean', async (request: FastifyRequest<{ Body: CleanupRequestBody }>, reply: FastifyReply) => {
    const {
      sessionRetentionDays,
      messageRetentionDays,
      metricsRetentionDays,
      syncMetadataRetentionDays,
      batchSize,
      dryRun = false
    } = request.body;

    const config: Partial<RetentionConfig> = { dryRun };

    // Validate and set config parameters
    if (sessionRetentionDays !== undefined) {
      const days = parseInt(sessionRetentionDays.toString());
      if (isNaN(days) || days < 1 || days > 3650) {
        throw app.httpErrors.badRequest('sessionRetentionDays must be between 1 and 3650');
      }
      config.sessionRetentionDays = days;
    }

    if (messageRetentionDays !== undefined) {
      const days = parseInt(messageRetentionDays.toString());
      if (isNaN(days) || days < 1 || days > 3650) {
        throw app.httpErrors.badRequest('messageRetentionDays must be between 1 and 3650');
      }
      config.messageRetentionDays = days;
    }

    if (metricsRetentionDays !== undefined) {
      const days = parseInt(metricsRetentionDays.toString());
      if (isNaN(days) || days < 1 || days > 3650) {
        throw app.httpErrors.badRequest('metricsRetentionDays must be between 1 and 3650');
      }
      config.metricsRetentionDays = days;
    }

    if (syncMetadataRetentionDays !== undefined) {
      const days = parseInt(syncMetadataRetentionDays.toString());
      if (isNaN(days) || days < 1 || days > 365) {
        throw app.httpErrors.badRequest('syncMetadataRetentionDays must be between 1 and 365');
      }
      config.syncMetadataRetentionDays = days;
    }

    if (batchSize !== undefined) {
      const size = parseInt(batchSize.toString());
      if (isNaN(size) || size < 100 || size > 10000) {
        throw app.httpErrors.badRequest('batchSize must be between 100 and 10000');
      }
      config.batchSize = size;
    }

    if (typeof dryRun !== 'boolean') {
      throw app.httpErrors.badRequest('dryRun must be a boolean');
    }

    console.log(`🧹 Starting data retention cleanup via API (dryRun: ${dryRun})...`);

    const result = await retentionManager.cleanupOldData(config);
    
    const statusCode = result.success ? 200 : 207; // 207 Multi-Status for partial success
    
    return reply.status(statusCode).send({
      success: result.success,
      data: {
        deleted: result.deleted,
        timing: {
          startTime: result.timing.startTime,
          endTime: result.timing.endTime,
          durationMs: result.timing.durationMs,
          durationHuman: `${(result.timing.durationMs / 1000).toFixed(2)}s`
        },
        totalDeleted: Object.values(result.deleted).reduce((sum, count) => sum + count, 0),
        errors: result.errors.length > 0 ? {
          count: result.errors.length,
          details: result.errors
        } : undefined,
        dryRun
      },
      timestamp: new Date().toISOString()
    });
  });

  // Schedule cleanup (placeholder for future implementation)
  app.post<{
    Body: ScheduleRequestBody;
  }>('/schedule', async (request: FastifyRequest<{ Body: ScheduleRequestBody }>, reply: FastifyReply) => {
    const { cronExpression = '0 2 * * *' } = request.body;

    // Basic cron validation
    if (typeof cronExpression !== 'string' || cronExpression.split(' ').length !== 5) {
      throw app.httpErrors.badRequest('cronExpression must be a valid 5-field cron expression');
    }

    await retentionManager.scheduleCleanup(cronExpression);
    
    return reply.send({
      success: true,
      message: `Data cleanup scheduled with expression: ${cronExpression}`,
      note: 'Automatic scheduling is not yet fully implemented. Use this endpoint to configure the schedule.',
      timestamp: new Date().toISOString()
    });
  });
}