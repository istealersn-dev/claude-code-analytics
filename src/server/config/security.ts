import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../app.js';

export async function setupSecurity(app: FastifyInstance, _config: AppConfig): Promise<void> {
  // Register helmet plugin for security headers
  await app.register(import('@fastify/helmet'), {
    crossOriginEmbedderPolicy: false, // Allow embedding for dashboard
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  });

  // Register rate limiting plugin
  await app.register(import('@fastify/rate-limit'), {
    max: 100, // Max requests per time window
    timeWindow: '1 minute',
    cache: 10000, // Cache size
    allowList: ['127.0.0.1'],
    redis: undefined, // Use in-memory cache for now
    skipOnError: true, // Continue on rate limit errors
    keyGenerator: (request) => {
      return request.ip;
    },
    errorResponseBuilder: () => {
      return {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded, retry in 1 minute',
        statusCode: 429,
        timestamp: new Date().toISOString(),
      };
    },
  });

  // Register sensible plugin for additional utilities
  await app.register(import('@fastify/sensible'));
}
