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

# Copy production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/schema.sql ./schema.sql

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

