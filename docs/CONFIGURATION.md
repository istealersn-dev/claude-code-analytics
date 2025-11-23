# Configuration Guide

Complete configuration reference for Claude Code Analytics Dashboard.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Database Configuration](#database-configuration)
- [Deployment Scenarios](#deployment-scenarios)

## Environment Variables

### Backend Configuration

Create a `.env` file in the project root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=claude_code_analytics

# Application Settings
NODE_ENV=development
HOST=0.0.0.0
PORT=3001

# Data Settings
CLAUDE_DATA_PATH=~/.claude/projects
DATA_RETENTION_DAYS=90

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

#### Backend Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | - | PostgreSQL host address |
| `DB_PORT` | Yes | `5432` | PostgreSQL port |
| `DB_USER` | Yes | - | PostgreSQL username |
| `DB_PASSWORD` | Yes | - | PostgreSQL password |
| `DB_NAME` | Yes | - | PostgreSQL database name |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`) |
| `HOST` | No | `0.0.0.0` | Server bind address |
| `PORT` | No | `3001` | Server port |
| `CLAUDE_DATA_PATH` | No | `~/.claude/projects` | Path to Claude Code data files |
| `DATA_RETENTION_DAYS` | No | `90` | Number of days to retain data |
| `CORS_ORIGINS` | No | `*` | Comma-separated list of allowed CORS origins |

### Frontend Configuration

Create a `frontend/.env.local` file:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Development Settings
VITE_DEV_MODE=true
VITE_LOG_LEVEL=debug
```

#### Frontend Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | - | Backend API base URL |
| `VITE_DEV_MODE` | No | `false` | Enable development features |
| `VITE_LOG_LEVEL` | No | `info` | Logging level (`debug`, `info`, `warn`, `error`) |

## Database Configuration

### PostgreSQL Setup

#### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install PostgreSQL (Windows)
# Download installer from https://www.postgresql.org/download/windows/
```

#### Option 2: Docker PostgreSQL

```bash
# Using Docker Compose (recommended)
docker-compose up -d db

# Or run standalone PostgreSQL container
docker run -d \
  --name claude-analytics-db \
  -e POSTGRES_USER=your_username \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=claude_code_analytics \
  -p 5432:5432 \
  postgres:14
```

### Database Initialization

```bash
# Create database
createdb claude_code_analytics

# Run schema setup
psql -d claude_code_analytics -f schema.sql

# Verify setup
psql -d claude_code_analytics -c "\dt"
```

### Database Connection String

Alternatively, you can use a connection string instead of individual environment variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/claude_code_analytics
```

## Deployment Scenarios

### Development (Separate Servers)

**Backend** (`.env`):
```env
NODE_ENV=development
HOST=0.0.0.0
PORT=3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

**Frontend** (`frontend/.env.local`):
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_DEV_MODE=true
```

### Production (Same Origin)

Deploy frontend and backend on the same domain:

**Backend** (`.env`):
```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
CORS_ORIGINS=https://yourdomain.com
```

**Frontend** (`frontend/.env.production`):
```env
VITE_API_BASE_URL=/api
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/frontend/dist;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Production (Subdomain)

Deploy backend on separate subdomain:

**Backend** (`.env`):
```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
CORS_ORIGINS=https://app.yourdomain.com
```

**Frontend** (`frontend/.env.production`):
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Docker Compose Deployment

Use the included `docker-compose.yml`:

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Environment for Docker Compose** (`.env`):
```env
# Database
DB_HOST=db
DB_PORT=5432
DB_USER=claude_analytics
DB_PASSWORD=your_secure_password
DB_NAME=claude_code_analytics

# Application
NODE_ENV=production
PORT=3001

# Data
CLAUDE_DATA_PATH=/data/claude
DATA_RETENTION_DAYS=90

# CORS
CORS_ORIGINS=http://localhost:5173
```

## Advanced Configuration

### Data Retention

Configure how long to keep historical data:

```env
DATA_RETENTION_DAYS=90  # Keep 90 days of data
```

To manually trigger cleanup:

```bash
npm run db:cleanup
```

### Claude Data Path

Point to your Claude Code data directory:

```env
# macOS/Linux
CLAUDE_DATA_PATH=~/.claude/projects

# Windows
CLAUDE_DATA_PATH=C:\Users\YourName\.claude\projects

# Custom path
CLAUDE_DATA_PATH=/path/to/claude/data
```

### CORS Configuration

Control which origins can access the API:

```env
# Development (allow multiple ports)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Production (specific domain)
CORS_ORIGINS=https://yourdomain.com

# Multiple domains
CORS_ORIGINS=https://app1.yourdomain.com,https://app2.yourdomain.com

# Allow all (not recommended for production)
CORS_ORIGINS=*
```

### Logging

Configure application logging:

```env
# Backend
LOG_LEVEL=debug  # debug, info, warn, error
LOG_FORMAT=pretty  # pretty, json

# Frontend
VITE_LOG_LEVEL=debug
```

### Performance Tuning

For large datasets:

```env
# Increase database connection pool
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000

# Adjust query limits
MAX_SESSIONS_PER_PAGE=50
MAX_MESSAGES_PER_SESSION=1000

# Cache settings
ENABLE_QUERY_CACHE=true
CACHE_TTL=300  # seconds
```

## Security Considerations

### Production Checklist

- [ ] Change default database password
- [ ] Use strong passwords (min 16 characters)
- [ ] Enable SSL/TLS for database connections
- [ ] Restrict CORS to specific origins
- [ ] Use environment variables for secrets (never commit `.env`)
- [ ] Enable HTTPS in production
- [ ] Implement rate limiting
- [ ] Set up database backups
- [ ] Review file permissions for Claude data directory

### Database SSL

For production databases with SSL:

```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

### Secrets Management

For production deployments, use secrets management:

```bash
# Using Docker secrets
docker secret create db_password ./db_password.txt

# Using Kubernetes secrets
kubectl create secret generic claude-analytics \
  --from-literal=db-password=your_password
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to database

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U your_username -d claude_code_analytics
```

**Problem**: CORS errors

```env
# Ensure frontend URL is in CORS_ORIGINS
CORS_ORIGINS=http://localhost:5173
```

### API Connection Issues

**Problem**: Frontend cannot reach backend

```bash
# Check backend is running
curl http://localhost:3001/api/analytics/overview

# Verify VITE_API_BASE_URL
echo $VITE_API_BASE_URL
```

### Docker Issues

```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up -d --build
```

## Environment Template Files

### `.env.example` Template

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=changeme
DB_NAME=claude_code_analytics

# Application Settings
NODE_ENV=development
HOST=0.0.0.0
PORT=3001

# Data Settings
CLAUDE_DATA_PATH=~/.claude/projects
DATA_RETENTION_DAYS=90

# CORS Configuration
CORS_ORIGINS=http://localhost:5173
```

### `frontend/.env.example` Template

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Development Settings
VITE_DEV_MODE=true
VITE_LOG_LEVEL=info
```
