import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AnalyticsQueryBuilder, type DataQualityMetrics, type CleanupResult } from '../../database/query-builder.js';

export const dataQualityRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const queryBuilder = new AnalyticsQueryBuilder();

  // Get comprehensive data quality metrics
  app.get('/metrics', async (_request, reply) => {
    try {
      const metrics = await queryBuilder.getDataQualityMetrics();

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
      const result = await queryBuilder.cleanupDuplicateSessions();

      return reply.send({
        success: true,
        data: result,
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
      const result = await queryBuilder.cleanupOrphanedMetrics();

      return reply.send({
        success: true,
        data: result,
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
      const validationResults = await queryBuilder.validateDataIntegrity();

      return reply.send({
        success: true,
        data: {
          validationResults,
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