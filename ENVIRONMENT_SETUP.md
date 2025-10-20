# Environment Configuration Guide

## Overview

Claude Code Analytics now supports flexible environment configuration for different deployment scenarios. This guide explains how to configure the application for development, staging, and production environments.

## Environment Variables

### Frontend Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3001/api` (dev) | `/api` (prod) |
| `VITE_DEV_MODE` | Enable development features | `true` (dev) | `false` (prod) |
| `VITE_LOG_LEVEL` | Logging level | `debug` (dev) | `error` (prod) |

### Backend Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Node environment | `development` | `production` |
| `HOST` | Server host | `0.0.0.0` | `0.0.0.0` |
| `PORT` | Server port | `3001` | `3001` |
| `DB_HOST` | Database host | `localhost` | `db` (Docker) |
| `DB_PORT` | Database port | `5432` | `5432` |
| `DB_NAME` | Database name | `claude_code_analytics` | `claude_code_analytics` |
| `DB_USER` | Database user | `postgres` | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` | `secure_password` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173,http://localhost:5174` | `https://yourdomain.com` |

## Configuration Methods

### 1. Development Environment

#### Option A: Environment File
Create `frontend/.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_DEV_MODE=true
VITE_LOG_LEVEL=debug
```

#### Option B: Command Line
```bash
VITE_API_BASE_URL=http://localhost:3001/api npm run dev
```

### 2. Production Environment

#### Docker Compose
Create `.env` file in project root:
```bash
VITE_API_BASE_URL=/api
NODE_ENV=production
DB_PASSWORD=your_secure_password
CORS_ORIGINS=https://yourdomain.com
```

#### Docker Build
```bash
docker build --build-arg VITE_API_BASE_URL=/api -t claude-code-analytics .
```

### 3. Staging Environment

Create `frontend/.env.staging`:
```bash
VITE_API_BASE_URL=https://staging-api.yourdomain.com/api
VITE_DEV_MODE=false
VITE_LOG_LEVEL=info
```

## Deployment Scenarios

### Scenario 1: Same-Origin Deployment
**Use Case**: Frontend and backend served from same domain
**Configuration**:
```bash
VITE_API_BASE_URL=/api
```

### Scenario 2: Subdomain Deployment
**Use Case**: Frontend on `app.yourdomain.com`, API on `api.yourdomain.com`
**Configuration**:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Scenario 3: Different Ports (Development)
**Use Case**: Local development with different ports
**Configuration**:
```bash
VITE_API_BASE_URL=http://localhost:3001/api
```

### Scenario 4: Docker Compose
**Use Case**: Containerized deployment
**Configuration**:
```bash
# In docker-compose.yml
environment:
  - VITE_API_BASE_URL=/api
```

## Environment-Specific Files

### Development
- `frontend/.env.local` - Local development overrides
- `frontend/.env.development` - Development defaults

### Production
- `frontend/.env.production` - Production defaults
- `.env` - Docker Compose environment

### Staging
- `frontend/.env.staging` - Staging configuration

## Validation

The application validates environment configuration on startup:

```typescript
// Validates API base URL is configured
validateEnvironment();

// Logs configuration in development
logEnvironmentConfig();
```

## Troubleshooting

### Common Issues

1. **API calls failing**: Check `VITE_API_BASE_URL` is correctly set
2. **CORS errors**: Verify `CORS_ORIGINS` includes your frontend URL
3. **Build failures**: Ensure all required environment variables are set

### Debug Mode

Enable debug logging:
```bash
VITE_LOG_LEVEL=debug npm run dev
```

### Environment Check

The application logs environment configuration in development mode:
```
🔧 Environment Configuration: {
  apiBaseUrl: "http://localhost:3001/api",
  mode: "development",
  isDevelopment: true,
  isProduction: false
}
```

## Security Notes

- Never commit `.env.local` or `.env.production` files
- Use strong passwords for production databases
- Configure CORS origins properly for production
- Use HTTPS in production environments

## Examples

### Complete Development Setup
```bash
# Backend
npm run dev

# Frontend (separate terminal)
cd frontend
VITE_API_BASE_URL=http://localhost:3001/api npm run dev
```

### Complete Production Setup
```bash
# Using Docker Compose
VITE_API_BASE_URL=/api docker-compose up --build
```

### Custom API URL
```bash
# For custom API endpoint
VITE_API_BASE_URL=https://my-api.example.com/api npm run dev
```
