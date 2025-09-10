# Backend API Dockerfile (Fastify + TypeScript)

FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
COPY schema.sql ./
RUN npm run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/schema.sql ./schema.sql

# Install minimal tools for healthcheck
RUN apk add --no-cache curl

# Use non-root user for runtime
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost:3001/api/health >/dev/null || exit 1

EXPOSE 3001

# Default environment variables (can be overridden)
ENV HOST=0.0.0.0 \
    PORT=3001 \
    DB_HOST=db \
    DB_PORT=5432 \
    DB_NAME=claude_code_analytics \
    DB_USER=postgres \
    DB_PASSWORD=postgres \
    LOG_LEVEL=info \
    NODE_ENV=production

CMD ["node", "dist/server/index.js"]
