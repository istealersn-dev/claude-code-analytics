import fastify, { type FastifyInstance } from 'fastify';
import 'dotenv/config';
import { DatabaseConnection } from '../database/connection.js';
import { setupCompression } from './config/compression.js';
import { setupCors } from './config/cors.js';
import { setupErrorHandling } from './config/error-handling.js';
import { registerRoutes } from './config/routes.js';
import { setupSecurity } from './config/security.js';

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  corsOrigins: string[];
  logLevel: string;
  enableSwagger: boolean;
}

export async function createApp(
  config?: Partial<AppConfig>,
): Promise<{ app: FastifyInstance; config: AppConfig }> {
  const defaultConfig: AppConfig = {
    port: parseInt(process.env['PORT'] || '3001', 10),
    host: process.env['HOST'] || '0.0.0.0',
    nodeEnv: process.env['NODE_ENV'] || 'development',
    corsOrigins: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:3000'],
    logLevel: process.env['LOG_LEVEL'] || 'info',
    enableSwagger:
      process.env['ENABLE_SWAGGER'] === 'true' || process.env['NODE_ENV'] === 'development',
  };

  const appConfig = { ...defaultConfig, ...config };

  const app = fastify({
    logger:
      appConfig.nodeEnv !== 'test'
        ? {
            level: appConfig.logLevel,
          }
        : false,
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024, // 10MB
    requestIdHeader: 'x-request-id',
  });

  // Setup middleware and plugins
  await setupSecurity(app, appConfig);
  await setupCors(app, appConfig);
  await setupCompression(app, appConfig);
  await setupErrorHandling(app, appConfig);

  // Register routes
  await registerRoutes(app);

  // Root endpoint
  app.get('/', async (_request, _reply) => {
    return {
      name: 'Claude Code Analytics API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        analytics: '/api/analytics',
        sync: '/api/sync',
        retention: '/api/retention',
      },
    };
  });

  return { app, config: appConfig };
}

export async function startServer(config?: Partial<AppConfig>) {
  console.log('🚀 Starting Claude Code Analytics API server...');

  // Initialize database connection
  try {
    const dbConfig = DatabaseConnection.getDefaultConfig();
    const db = DatabaseConnection.getInstance(dbConfig);

    const isHealthy = await db.testConnection();
    if (!isHealthy) {
      throw new Error('Database connection failed');
    }

    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }

  const { app, config: appConfig } = await createApp(config);

  try {
    const address = await app.listen({
      port: appConfig.port,
      host: appConfig.host,
    });

    console.log(`🌐 Server running at ${address}`);
    console.log(`📝 Environment: ${appConfig.nodeEnv}`);
    console.log(`🏥 Health check: ${address}/api/health`);

    if (appConfig.nodeEnv === 'development') {
      console.log('\n📋 Available endpoints:');
      console.log('  GET  /api/health           - Health check');
      console.log('  GET  /api/analytics        - Usage metrics');
      console.log('  GET  /api/analytics/costs  - Cost analysis');
      console.log('  GET  /api/analytics/tokens - Token analysis');
      console.log('  GET  /api/sync/status      - Sync status');
      console.log('  POST /api/sync/run         - Run data sync');
      console.log('  GET  /api/retention/stats  - Retention statistics');
      console.log('  POST /api/retention/clean  - Run data cleanup');
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n📋 Received ${signal}, shutting down gracefully...`);

    try {
      await app.close();
      console.log('🔌 HTTP server closed');

      const db = DatabaseConnection.getInstance();
      await db.close();
      console.log('🔌 Database connections closed');

      console.log('👋 Server shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return { server: app, app, config: appConfig };
}
