import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { DatabaseConnection } from '../../database/connection.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Basic health check
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();

    try {
      const db = DatabaseConnection.getInstance();
      const healthCheck = await db.healthCheck();
      const responseTime = Date.now() - startTime;

      const response = {
        status: healthCheck.status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime,
        version: '1.0.0',
        environment: process.env['NODE_ENV'] || 'development',
        database: {
          status: healthCheck.status,
          connected: healthCheck.details.connected,
          latency: healthCheck.details.latency,
          connections: healthCheck.details.poolStats,
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      };

      const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
      return reply.status(statusCode).send(response);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return reply.status(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        error: {
          message: 'Health check failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });

  // Detailed readiness check
  app.get('/ready', async (_request: FastifyRequest, reply: FastifyReply) => {
    const checks = {
      database: false,
      memory: false,
      disk: false,
    };

    const errors: string[] = [];

    try {
      // Database check
      const db = DatabaseConnection.getInstance();
      const dbHealth = await db.healthCheck();
      checks.database = dbHealth.status === 'healthy';
      if (!checks.database) {
        errors.push('Database connection failed');
      }

      // Memory check (fail if using > 80% of available memory)
      const memUsage = process.memoryUsage();
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      checks.memory = memoryUsagePercent < 80;
      if (!checks.memory) {
        errors.push(`High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
      }

      // Simple disk space check (always pass for now - would implement real check in production)
      checks.disk = true;

      const allHealthy = Object.values(checks).every((check) => check);
      const status = allHealthy ? 'ready' : 'not_ready';

      return reply.status(allHealthy ? 200 : 503).send({
        status,
        timestamp: new Date().toISOString(),
        checks,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      return reply.status(503).send({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks,
        errors: ['Health check failed', error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  });

  // Liveness check (simpler check for Kubernetes)
  app.get('/live', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Database-specific health
  app.get('/db', async (_request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();

    try {
      const db = DatabaseConnection.getInstance();

      // Test basic query
      const testResult = await db.query('SELECT NOW() as current_time, version() as version');
      const latency = Date.now() - startTime;

      // Get connection pool stats
      const poolStats = await db.getStats();

      return reply.send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        latency,
        server: {
          currentTime: testResult.rows[0] ? (testResult.rows[0] as any)['current_time'] : new Date(),
          version: testResult.rows[0] ? String((testResult.rows[0] as any)['version']).split(',')[0] : 'unknown',
        },
        connectionPool: {
          total: poolStats.totalConnections,
          idle: poolStats.idleConnections,
          waiting: poolStats.waitingConnections,
        },
      });
    } catch (error) {
      const latency = Date.now() - startTime;

      return reply.status(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        latency,
        error: {
          message: 'Database health check failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });
}
