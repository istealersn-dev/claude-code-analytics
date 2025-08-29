import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppConfig } from '../app.js';

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
  details?: any;
}

export async function setupErrorHandling(app: FastifyInstance, config: AppConfig): Promise<void> {
  // Global error handler
  app.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = (typeof request.headers['x-request-id'] === 'string' ? request.headers['x-request-id'] : undefined) || request.id;
    
    // Log error details
    request.log.error({
      error: error.message,
      stack: error.stack,
      requestId,
      url: request.url,
      method: request.method,
      statusCode: error.statusCode
    }, 'Request error');

    const apiError: ApiError = {
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      requestId
    };

    // Add error details in development mode
    if (config.nodeEnv === 'development') {
      apiError.details = {
        stack: error.stack,
        validation: error.validation || undefined
      };
    }

    // Handle specific error types
    if (error.statusCode === 429) {
      apiError.error = 'Too Many Requests';
      apiError.message = 'Rate limit exceeded, please try again later';
    } else if (error.statusCode === 413) {
      apiError.error = 'Payload Too Large';
      apiError.message = 'Request body exceeds size limit';
    } else if (error.validation) {
      apiError.error = 'Validation Error';
      apiError.message = 'Request validation failed';
    }

    return reply.status(apiError.statusCode).send(apiError);
  });

  // Not found handler
  app.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const apiError: ApiError = {
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      requestId: (typeof request.headers['x-request-id'] === 'string' ? request.headers['x-request-id'] : undefined) || request.id
    };

    return reply.status(404).send(apiError);
  });

  // Request/response logging hook
  app.addHook('onRequest', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip
    }, 'Incoming request');
  });

  app.addHook('onResponse', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime
    }, 'Request completed');
  });
}