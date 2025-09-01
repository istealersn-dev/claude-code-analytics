import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { type AnalyticsFilters, AnalyticsQueryBuilder } from '../../database/query-builder.js';

// TypeScript interfaces for query parameters
interface AnalyticsQuerystring {
  dateFrom?: string;
  dateTo?: string;
  projectName?: string;
  modelName?: string;
  sessionIds?: string | string[];
  limit?: string;
  offset?: string;
}

interface SessionParams {
  sessionId: string;
}

// QueryBuilder will be initialized inside the plugin function

// Helper to parse and validate query filters
function parseFilters(query: any, app: FastifyInstance): AnalyticsFilters {
  const filters: AnalyticsFilters = {};

  if (query.dateFrom) {
    const dateFrom = new Date(query.dateFrom);
    if (Number.isNaN(dateFrom.getTime())) {
      throw app.httpErrors.badRequest(
        'Invalid dateFrom format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
      );
    }
    filters.dateFrom = dateFrom;
  }

  if (query.dateTo) {
    const dateTo = new Date(query.dateTo);
    if (Number.isNaN(dateTo.getTime())) {
      throw app.httpErrors.badRequest(
        'Invalid dateTo format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
      );
    }
    filters.dateTo = dateTo;
  }

  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    throw app.httpErrors.badRequest('dateFrom must be earlier than dateTo');
  }

  if (query.projectName) {
    filters.projectName = String(query.projectName);
  }

  if (query.modelName) {
    filters.modelName = String(query.modelName);
  }

  if (query.sessionIds) {
    const sessionIds = Array.isArray(query.sessionIds)
      ? query.sessionIds
      : String(query.sessionIds).split(',');
    filters.sessionIds = sessionIds.map((id: any) => String(id).trim());
  }

  if (query.limit) {
    const limit = parseInt(query.limit, 10);
    if (Number.isNaN(limit) || limit < 1 || limit > 1000) {
      throw app.httpErrors.badRequest('limit must be a number between 1 and 1000');
    }
    filters.limit = limit;
  }

  if (query.offset) {
    const offset = parseInt(query.offset, 10);
    if (Number.isNaN(offset) || offset < 0) {
      throw app.httpErrors.badRequest('offset must be a non-negative number');
    }
    filters.offset = offset;
  }

  return filters;
}

export const analyticsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const queryBuilder = new AnalyticsQueryBuilder();

  // Overview metrics (used by frontend dashboard)
  app.get<{ Querystring: AnalyticsQuerystring }>('/overview', async (request, reply) => {
    const filters = parseFilters(request.query, app);
    const overview = await queryBuilder.getUsageMetrics(filters);

    return reply.send(overview);
  });

  // Dashboard summary - overview metrics
  app.get<{ Querystring: AnalyticsQuerystring }>('/summary', async (request, reply) => {
    const filters = parseFilters(request.query, app);
    const summary = await queryBuilder.getDashboardSummary(filters);

    return reply.send({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  });

  // General usage metrics
  app.get<{ Querystring: AnalyticsQuerystring }>('/', async (request, reply) => {
    const filters = parseFilters(request.query, app);
    const metrics = await queryBuilder.getUsageMetrics(filters);

    return reply.send({
      success: true,
      data: metrics,
      filters,
      timestamp: new Date().toISOString(),
    });
  });

  // Cost analysis
  app.get<{ Querystring: AnalyticsQuerystring }>('/costs', async (request, reply) => {
    const filters = parseFilters(request.query, app);
    const costAnalysis = await queryBuilder.getCostAnalysis(filters);

    return reply.send(costAnalysis);
  });

  // Token analysis
  app.get<{ Querystring: AnalyticsQuerystring }>('/tokens', async (request, reply) => {
    const filters = parseFilters(request.query, app);
    const tokenAnalysis = await queryBuilder.getTokenAnalysis(filters);

    return reply.send({
      success: true,
      data: tokenAnalysis,
      filters,
      timestamp: new Date().toISOString(),
    });
  });

  // Sessions list with pagination
  app.get<{ Querystring: AnalyticsQuerystring }>('/sessions', async (request, reply) => {
    const filters = parseFilters(request.query, app);

    // Default pagination
    if (!filters.limit) {
      filters.limit = 50;
    }
    if (!filters.offset) {
      filters.offset = 0;
    }

    const result = await queryBuilder.getSessionsList(filters);

    return reply.send({
      success: true,
      data: {
        sessions: result.sessions,
        pagination: {
          total: result.total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: result.hasMore,
          currentPage: Math.floor(filters.offset / filters.limit) + 1,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      },
      filters,
      timestamp: new Date().toISOString(),
    });
  });

  // Individual session details
  app.get<{ Params: SessionParams }>('/sessions/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;

    if (!sessionId) {
      throw app.httpErrors.badRequest('Session ID is required');
    }

    const session = await queryBuilder.getSessionDetails(sessionId);

    if (!session) {
      throw app.httpErrors.notFound(`Session with ID '${sessionId}' not found`);
    }

    return reply.send({
      success: true,
      data: session,
      timestamp: new Date().toISOString(),
    });
  });

  // Daily usage time-series data
  app.get<{ Querystring: AnalyticsQuerystring }>('/daily-usage', async (request, reply) => {
    const filters = parseFilters(request.query, app);
    const dailyUsage = await queryBuilder.getDailyUsageTimeSeries(filters);

    return reply.send(dailyUsage);
  });

  // Analytics metadata (available filters, date ranges, etc.)
  app.get('/metadata', async (_request, reply) => {
    // This would typically be cached
    const metadata = await queryBuilder.getUsageMetrics({});

    // Extract available options from the data
    const availableProjects = metadata.topProjects.map((p) => p.project);
    const availableModels = metadata.topModels.map((m) => m.model);
    const availableTools = metadata.topTools.map((t) => t.tool);

    return reply.send({
      success: true,
      data: {
        filters: {
          availableProjects,
          availableModels,
          availableTools,
        },
        limits: {
          maxLimit: 1000,
          defaultLimit: 50,
          maxDateRange: 365, // days
        },
        totalSessions: metadata.totalSessions,
        dateRange: {
          // Would typically query the actual min/max dates
          earliest: null,
          latest: null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  });
};
