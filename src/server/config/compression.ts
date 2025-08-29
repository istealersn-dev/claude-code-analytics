import { FastifyInstance } from 'fastify';
import { AppConfig } from '../app.js';

export async function setupCompression(app: FastifyInstance, config: AppConfig): Promise<void> {
  await app.register(import('@fastify/compress'), {
    global: true,
    threshold: 1024, // Only compress responses > 1KB
    encodings: ['gzip', 'deflate'],
    customTypes: /^text\/|\+json$|\+text$|\+xml$/,
    removeContentLengthHeader: true
  });
}