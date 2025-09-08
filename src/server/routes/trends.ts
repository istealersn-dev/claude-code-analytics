import { FastifyInstance } from 'fastify';
import { AnalyticsQueryBuilder, AnalyticsFilters } from '../../database/query-builder.js';

export async function trendsRoutes(fastify: FastifyInstance) {
  const queryBuilder = new AnalyticsQueryBuilder();

  fastify.get('/analysis', async (request, reply) => {
    try {
      const query = request.query as Record<string, unknown>;
      
      const filters: AnalyticsFilters = {
        dateFrom: query['dateFrom'] ? new Date(query['dateFrom'] as string) : undefined,
        dateTo: query['dateTo'] ? new Date(query['dateTo'] as string) : undefined,
        projectName: query['projectName'] as string | undefined,
        modelName: query['modelName'] as string | undefined,
      };

      const analysis = await queryBuilder.getTrendAnalysis(filters);
      
      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      fastify.log.error(`Error fetching trend analysis: ${error}`);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch trend analysis data',
      });
    }
  });

  fastify.get('/cost-optimization', async (request, reply) => {
    try {
      const query = request.query as Record<string, unknown>;
      
      const filters: AnalyticsFilters = {
        dateFrom: query['dateFrom'] ? new Date(query['dateFrom'] as string) : undefined,
        dateTo: query['dateTo'] ? new Date(query['dateTo'] as string) : undefined,
        projectName: query['projectName'] as string | undefined,
        modelName: query['modelName'] as string | undefined,
      };

      const insights = await queryBuilder.getCostOptimizationInsights(filters);
      
      return {
        success: true,
        data: insights,
      };
    } catch (error) {
      fastify.log.error(`Error fetching cost optimization insights: ${error}`);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch cost optimization insights',
      });
    }
  });
}