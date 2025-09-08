import type { FastifyInstance } from 'fastify';
import { analyticsRoutes } from '../routes/analytics.js';
import { dataQualityRoutes } from '../routes/data-quality.js';
import { healthRoutes } from '../routes/health.js';
import { retentionRoutes } from '../routes/retention.js';
import { syncRoutes } from '../routes/sync.js';
import { trendsRoutes } from '../routes/trends.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Register API routes with prefix
  await app.register(healthRoutes, { prefix: '/api/health' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(syncRoutes, { prefix: '/api/sync' });
  await app.register(retentionRoutes, { prefix: '/api/retention' });
  await app.register(dataQualityRoutes, { prefix: '/api/data-quality' });
  await app.register(trendsRoutes, { prefix: '/api/trends' });
}
