# Development Guide

Complete development workflow and tooling guide for Claude Code Analytics Dashboard.

## Table of Contents

- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Available Scripts](#available-scripts)
- [Code Conventions](#code-conventions)
- [Testing](#testing)
- [Debugging](#debugging)
- [Development Phases](#development-phases)

## Project Structure

```
claude-code-analytics/
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── charts/        # Chart components (Recharts)
│   │   │   ├── layout/        # Layout components
│   │   │   └── ui/            # UI primitives
│   │   ├── routes/            # TanStack Router pages
│   │   │   ├── __root.tsx     # Root layout
│   │   │   ├── index.tsx      # Dashboard home
│   │   │   ├── sessions/      # Sessions routes
│   │   │   └── settings/      # Settings routes
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useAnalytics.ts
│   │   │   └── useSync.ts
│   │   ├── lib/               # Utility libraries
│   │   │   ├── api.ts         # API client
│   │   │   └── utils.ts       # Helper functions
│   │   ├── types/             # TypeScript interfaces
│   │   └── main.tsx           # Application entry
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
│
├── src/                       # Backend application
│   ├── server/                # Fastify server
│   │   ├── app.ts             # Server setup
│   │   ├── routes/            # API route handlers
│   │   │   ├── analytics.ts
│   │   │   └── sync.ts
│   │   └── plugins/           # Fastify plugins
│   ├── database/              # Database utilities
│   │   ├── query-builder.ts   # Analytics query abstraction
│   │   ├── connection.ts      # DB connection pool
│   │   └── migrations/        # Database migrations
│   ├── parsers/               # Data parsing
│   │   ├── jsonl-parser.ts    # Claude Code JSONL parser
│   │   └── session-parser.ts  # Session data parser
│   ├── services/              # Business logic
│   │   ├── data-sync.ts       # Data synchronization
│   │   ├── analytics.ts       # Analytics calculations
│   │   └── validation.ts      # Data validation
│   ├── types/                 # Shared TypeScript types
│   │   ├── database.ts
│   │   ├── api.ts
│   │   └── claude-data.ts
│   └── index.ts               # Application entry
│
├── tests/                     # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
│
├── docs/                      # Documentation
│   ├── API.md
│   ├── CONFIGURATION.md
│   ├── DEVELOPMENT.md
│   └── ARCHITECTURE.md
│
├── schema.sql                 # Database schema
├── docker-compose.yml         # Container orchestration
├── .env.example               # Environment template
├── package.json               # Backend dependencies
└── tsconfig.json              # TypeScript configuration
```

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/istealersn-dev/claude-code-analytics.git
cd claude-code-analytics

# 2. Install dependencies
npm install
cd frontend && npm install && cd ..

# 3. Setup database
createdb claude_code_analytics
psql -d claude_code_analytics -f schema.sql

# 4. Configure environment
cp .env.example .env
cp frontend/.env.example frontend/.env.local
# Edit .env files with your settings

# 5. Start development servers
npm run dev:all
```

### Daily Development

```bash
# Start both servers (recommended)
npm run dev:all

# Or start separately
npm run dev              # Backend only
npm run dev:frontend     # Frontend only

# Open browser
open http://localhost:5173
```

### Making Changes

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** with hot reload enabled

3. **Test changes**
   ```bash
   npm run test              # Backend tests
   npm run test:frontend     # Frontend tests
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Available Scripts

### Quick Development (Recommended)

```bash
npm run dev:all             # 🚀 Start both backend & frontend concurrently
```

This starts:
- Backend API server at `http://localhost:3001`
- Frontend dev server at `http://localhost:5173`
- Colored output logs for easy debugging

### Backend Scripts

```bash
npm run dev                 # Start backend in development mode (alias for dev:server)
npm run dev:server          # Start backend server only (with tsx watch)
npm run build               # Build TypeScript to JavaScript
npm run start               # Run built application (production)
npm run clean               # Remove dist directory
```

### Frontend Scripts

```bash
npm run dev:frontend        # Start frontend dev server
npm run build:frontend      # Build frontend for production
npm run preview:frontend    # Preview production build
npm run lint:frontend       # Lint frontend code
```

### Combined Scripts

```bash
npm run build:all           # Build both backend and frontend
npm run clean:all           # Clean both dist directories
```

### Database Scripts

```bash
npm run db:reset            # Reset database schema (WARNING: deletes all data)
npm run db:connect          # Connect to PostgreSQL with psql
npm run db:test             # Test database connection
npm run db:backup           # Create database backup
npm run db:restore          # Restore from backup
npm run db:cleanup          # Remove old data based on retention policy
```

### Testing Scripts

```bash
npm run test                # Run all backend tests
npm run test:parser         # Run JSONL parser tests
npm run test:db             # Run database tests
npm run test:frontend       # Run frontend tests
npm run test:e2e            # Run end-to-end tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate test coverage report
```

### Code Quality Scripts

```bash
npm run lint                # Lint backend code
npm run lint:fix            # Auto-fix linting issues
npm run format              # Format code with Biome
npm run type-check          # TypeScript type checking
npm run type-check:frontend # Frontend type checking
```

## Code Conventions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables/Functions | camelCase | `getUserSessions`, `parseTokenData` |
| Components/Types | PascalCase | `SessionChart`, `UserMetrics`, `DashboardProps` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETENTION_DAYS`, `DEFAULT_CHART_HEIGHT` |
| Files | kebab-case | `session-chart.tsx`, `api-client.ts` |
| CSS Classes | kebab-case | `.chart-container`, `.data-grid` |
| Database Columns | snake_case | `created_at`, `token_count`, `session_id` |

### Component Patterns

#### Single Responsibility

Each component should have one clear purpose:

```typescript
// ✅ Good - Single responsibility
export function SessionList({ sessions }: SessionListProps) {
  return <div>{sessions.map(s => <SessionItem key={s.id} session={s} />)}</div>
}

export function SessionItem({ session }: SessionItemProps) {
  return <div>{session.name}</div>
}

// ❌ Bad - Multiple responsibilities
export function Sessions() {
  // Fetching data, rendering list, handling filters, etc.
}
```

#### Explicit Props

All props should be defined with TypeScript interfaces:

```typescript
// ✅ Good
interface ChartProps {
  data: DataPoint[]
  height?: number
  showLegend?: boolean
}

export function Chart({ data, height = 300, showLegend = true }: ChartProps) {
  // ...
}

// ❌ Bad
export function Chart(props: any) {
  // ...
}
```

#### Composition Over Inheritance

```typescript
// ✅ Good - Composition
export function DashboardCard({ children, title }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  )
}

export function MetricsCard() {
  return (
    <DashboardCard title="Metrics">
      <MetricsContent />
    </DashboardCard>
  )
}
```

### Error Handling

#### Fail Fast Philosophy

```typescript
// ✅ Good - Fail fast with clear errors
export function parseSession(data: unknown): Session {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid session data: expected object')
  }

  if (!('id' in data) || typeof data.id !== 'string') {
    throw new Error('Invalid session data: missing or invalid id')
  }

  return data as Session
}

// ❌ Bad - Silent failures
export function parseSession(data: unknown): Session | null {
  try {
    return data as Session
  } catch {
    return null
  }
}
```

#### Descriptive Error Messages

```typescript
// ✅ Good
throw new Error(
  `Failed to parse JSONL file at ${filePath}: ` +
  `Line ${lineNumber} contains invalid JSON. ` +
  `Please check the file format or re-sync your Claude Code data.`
)

// ❌ Bad
throw new Error('Parse error')
```

### TypeScript Best Practices

```typescript
// ✅ Good - Proper types
interface Session {
  id: string
  startTime: Date
  endTime: Date | null
  cost: number
}

function calculateCost(session: Session): number {
  return session.cost
}

// ❌ Bad - Using any
function calculateCost(session: any): any {
  return session.cost
}
```

### Avoid Over-Engineering

```typescript
// ✅ Good - Simple and direct
export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`
}

// ❌ Bad - Over-engineered
export class CostFormatter {
  constructor(private locale: string, private currency: string) {}

  format(cost: number): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.currency
    }).format(cost)
  }
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test suite
npm run test:parser
npm run test:db

# Run in watch mode
npm run test:watch

# Generate coverage
npm run test:coverage
```

### Writing Tests

#### Unit Tests

```typescript
// tests/unit/parsers/jsonl-parser.test.ts
import { describe, it, expect } from 'vitest'
import { parseJSONL } from '@/parsers/jsonl-parser'

describe('JSONL Parser', () => {
  it('should parse valid JSONL', () => {
    const input = '{"id": "1"}\n{"id": "2"}'
    const result = parseJSONL(input)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('1')
  })

  it('should throw on invalid JSON', () => {
    const input = 'invalid json'
    expect(() => parseJSONL(input)).toThrow('Invalid JSON')
  })
})
```

#### Integration Tests

```typescript
// tests/integration/api/analytics.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '@/server/app'

describe('Analytics API', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/analytics/overview returns data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/analytics/overview'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      success: true,
      data: expect.objectContaining({
        totalSessions: expect.any(Number)
      })
    })
  })
})
```

## Debugging

### Backend Debugging

#### VS Code Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

#### Console Logging

```typescript
// Use structured logging
console.log('[Analytics] Fetching sessions:', { dateFrom, dateTo, limit })

// For errors
console.error('[Analytics] Failed to fetch sessions:', error)
```

### Frontend Debugging

#### React DevTools

Install browser extension: [React DevTools](https://react.dev/learn/react-developer-tools)

#### TanStack Query DevTools

Already included in development mode - look for floating icon in bottom-right corner.

#### Browser Console

```typescript
// Debug API calls
console.log('API Response:', await fetch('/api/analytics/overview').then(r => r.json()))

// Debug React state
console.log('Query state:', queryClient.getQueryState(['analytics', 'overview']))
```

### Database Debugging

```bash
# Connect to database
npm run db:connect

# View recent sessions
SELECT * FROM sessions ORDER BY start_time DESC LIMIT 10;

# Check sync status
SELECT * FROM sync_metadata;

# View query performance
EXPLAIN ANALYZE SELECT * FROM sessions WHERE start_time > NOW() - INTERVAL '7 days';
```

## Development Phases

All development phases are complete - production ready:

### ✅ Phase 1: Foundation & Data Pipeline (100%)
- Database schema design
- JSONL parser implementation
- Data synchronization service
- Basic API endpoints

### ✅ Phase 2: Frontend Foundation (100%)
- Vite + React + TypeScript setup
- TanStack Router configuration
- Basic dashboard layout
- API client implementation

### ✅ Phase 3: Advanced Analytics (85%)
- Time-series charts
- Model distribution analysis
- Tool usage statistics
- Interactive filtering

### ✅ Phase 4: Enhanced Features (100%)
- Real-time sync status
- Date range filtering
- Session drill-down views
- Responsive design

### ✅ Phase 5: Advanced Features & Automation (50%)
- **5.1-5.2 Complete ✅**: Advanced trends, cost optimization
- **5.3-5.6 Skipped ⏭️**: Automated reporting, external integrations (optional)

### ✅ Phase 6: Production & Deployment (100%)
- Docker containerization
- Comprehensive testing suite
- Claude Code 2.0 features
- Production deployment

**Recent Updates**:
- ✅ **November 2025**: Claude Code 2.0 is now the default schema
- ✅ **PR #18**: Enhanced dashboard with sub-metrics and thematic sections
- ✅ **PR #17**: Rebranded to Claulytics
- ✅ **PR #16**: Added chart export functionality
- ✅ **PR #15**: Improved sync interface

## Tips for Contributors

### Before Starting

1. Read the [Architecture Guide](ARCHITECTURE.md)
2. Review existing code patterns
3. Check open issues for context
4. Set up development environment completely

### While Developing

1. Use TypeScript strict mode
2. Write tests for new features
3. Follow code conventions
4. Keep commits focused and descriptive
5. Update documentation as you go

### Before Submitting

1. Run all tests: `npm run test`
2. Check types: `npm run type-check`
3. Format code: `npm run format`
4. Update relevant documentation
5. Write clear PR description

## Getting Help

- **Documentation**: Check `docs/` directory
- **Issues**: [GitHub Issues](https://github.com/istealersn-dev/claude-code-analytics/issues)
- **Code Questions**: Review `CLAUDE.md` for project conventions
