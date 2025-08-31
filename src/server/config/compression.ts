import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../app.js';

export async function setupCompression(app: FastifyInstance, _config: AppConfig): Promise<void> {
  await app.register(import('@fastify/compress'), {
    global: true,
    threshold: 1024, // Only compress responses > 1KB
    encodings: ['gzip', 'deflate'],
    customTypes: /^text\/|\+json$|\+text$|\+xml$/,
    removeContentLengthHeader: true,
  });
}
