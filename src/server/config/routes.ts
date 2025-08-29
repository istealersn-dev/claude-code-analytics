import { FastifyInstance } from 'fastify';
import { healthRoutes } from '../routes/health.js';
import { analyticsRoutes } from '../routes/analytics.js';
import { syncRoutes } from '../routes/sync.js';
import { retentionRoutes } from '../routes/retention.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Register API routes with prefix
  await app.register(healthRoutes, { prefix: '/api/health' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(syncRoutes, { prefix: '/api/sync' });
  await app.register(retentionRoutes, { prefix: '/api/retention' });
}