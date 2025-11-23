# Architecture Guide

Comprehensive technical architecture documentation for Claude Code Analytics Dashboard.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Database Design](#database-design)
- [Data Flow](#data-flow)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Design Philosophy](#design-philosophy)
- [Performance Considerations](#performance-considerations)

## Tech Stack

### Frontend

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **Vite** | Build tool | Lightning-fast HMR, modern ESM-based bundling |
| **React 18** | UI library | Component-based, great ecosystem, TypeScript support |
| **TypeScript** | Type system | Compile-time safety, better DX, self-documenting code |
| **Tailwind CSS v3** | Styling | Utility-first, rapid development, consistent design |
| **TanStack Router** | Routing | Type-safe routes, search params, file-based routing |
| **TanStack Query** | Server state | Caching, refetching, optimistic updates, DevTools |
| **Recharts** | Charts | Declarative API, flexible, built for React |

### Backend

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **Fastify** | Web framework | Fast, low overhead, TypeScript-friendly, plugin system |
| **TypeScript** | Type system | Shared types with frontend, type-safe APIs |
| **PostgreSQL 14+** | Database | Robust, ACID compliance, excellent query performance |
| **tsx** | Dev runtime | Fast TypeScript execution, hot reload |

### DevOps

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **Docker** | Containerization | Consistent environments, easy deployment |
| **Docker Compose** | Orchestration | Multi-service management, development parity |
| **Vitest** | Testing | Fast, Vite-native, great TypeScript support |
| **Biome** | Linting/Formatting | Fast, zero-config, Prettier/ESLint alternative |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React SPA (Vite + React)                   │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │  TanStack    │  │  TanStack    │  │  Recharts    │ │ │
│  │  │  Router      │  │  Query       │  │  Charts      │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Fastify Backend Server                    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    API Routes                           │ │
│  │  • /api/analytics/*   • /api/sync/*                    │ │
│  └──────────────┬─────────────────────┬───────────────────┘ │
│                 │                      │                     │
│  ┌──────────────▼──────────┐ ┌────────▼──────────────────┐ │
│  │  Analytics Service      │ │  Data Sync Service        │ │
│  │  • Query Builder        │ │  • JSONL Parser           │ │
│  │  • Aggregations         │ │  • File Processing        │ │
│  │  • Data Validation      │ │  • Incremental Updates    │ │
│  └──────────────┬──────────┘ └────────┬──────────────────┘ │
└─────────────────┼─────────────────────┼────────────────────┘
                  │                      │
                  ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  sessions    │  │session_metrics│ │raw_messages │      │
│  │              │  │               │  │              │      │
│  │  Core data   │  │  Aggregated   │  │  Message     │      │
│  │              │  │  analytics    │  │  details     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │sync_metadata │  │  Indexes      │                         │
│  │              │  │               │                         │
│  │  Sync state  │  │  Performance  │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ File Read
                            │
┌─────────────────────────────────────────────────────────────┐
│              Claude Code Data (~/.claude/projects/)         │
│                                                               │
│  project1/session.jsonl                                      │
│  project2/session.jsonl                                      │
│  ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

## Database Design

### Schema Philosophy

We use a **hybrid normalized approach** that balances:
- **Query Performance**: Denormalized metrics for fast dashboard queries
- **Data Integrity**: Normalized sessions and messages for consistency
- **Storage Efficiency**: Only essential data is duplicated

### Core Tables

#### `sessions`
Primary table for session metadata:

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    project_path TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_sessions_project_path ON sessions(project_path);
```

**Design Rationale**:
- UUID for globally unique IDs
- Timestamps with timezone for accurate tracking
- Indexes on frequently queried columns

#### `session_metrics`
Flattened analytics for fast queries:

```sql
CREATE TABLE session_metrics (
    session_id UUID PRIMARY KEY REFERENCES sessions(id),
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cache_creation_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    cost DECIMAL(10, 6) DEFAULT 0,
    duration INTEGER,
    message_count INTEGER DEFAULT 0
);
```

**Design Rationale**:
- Denormalized for performance (avoid JOINs on dashboard)
- One-to-one with sessions
- Decimal for precise cost tracking

#### `raw_messages`
Detailed conversation data:

```sql
CREATE TABLE raw_messages (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    model TEXT
);

CREATE INDEX idx_messages_session_id ON raw_messages(session_id);
CREATE INDEX idx_messages_timestamp ON raw_messages(timestamp);
```

**Design Rationale**:
- Normalized (3NF) for data integrity
- Cascade delete maintains referential integrity
- Indexed for drill-down queries

#### `sync_metadata`
Track synchronization state:

```sql
CREATE TABLE sync_metadata (
    id SERIAL PRIMARY KEY,
    file_path TEXT UNIQUE NOT NULL,
    last_modified TIMESTAMP WITH TIME ZONE,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_hash TEXT,
    sync_status TEXT DEFAULT 'success'
);
```

**Design Rationale**:
- Enables incremental sync
- File hash for change detection
- Status tracking for error handling

### Data Retention

Data older than configured retention period is automatically cleaned:

```sql
DELETE FROM sessions
WHERE start_time < NOW() - INTERVAL '90 days';
```

Cascading deletes handle related records.

## Data Flow

### Synchronization Flow

```
1. User clicks "Sync Now"
   ↓
2. Frontend calls POST /api/sync/run
   ↓
3. Backend DataSync service:
   a. Scans ~/.claude/projects/
   b. Identifies new/modified JSONL files
   c. Parses JSONL with JSONLParser
   d. Validates session data
   e. Inserts/updates database
   f. Updates sync_metadata
   ↓
4. Returns sync results to frontend
   ↓
5. Frontend invalidates queries
   ↓
6. Dashboard auto-refreshes with new data
```

### Query Flow

```
1. User opens dashboard
   ↓
2. TanStack Router loads route
   ↓
3. Components mount, useQuery hooks trigger
   ↓
4. TanStack Query checks cache
   ├─ Cache hit → Return cached data
   └─ Cache miss → Fetch from API
      ↓
5. API routes call AnalyticsQueryBuilder
   ↓
6. Query Builder generates optimized SQL
   ↓
7. PostgreSQL executes query with indexes
   ↓
8. Results transformed to JSON
   ↓
9. Frontend receives data
   ↓
10. TanStack Query caches results
    ↓
11. React re-renders with data
```

## Frontend Architecture

### State Management Strategy

We use **colocation** and **server state separation**:

```typescript
// ✅ Good: Server state managed by TanStack Query
function Dashboard() {
  const { data } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.analytics.getOverview()
  })

  return <OverviewCards data={data} />
}

// ✅ Good: Local UI state managed by React
function DateRangePicker() {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState(initialRange)

  return <Popover open={isOpen}>...</Popover>
}

// ❌ Bad: Mixing server state with React state
function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/analytics').then(setData) // Don't do this!
  }, [])
}
```

### Component Hierarchy

```
App
├── Router (TanStack Router)
│   ├── Root Layout
│   │   ├── Header
│   │   ├── Navigation
│   │   └── Outlet (page content)
│   │
│   ├── Dashboard Page (/)
│   │   ├── OverviewCards
│   │   ├── DailyUsageChart
│   │   ├── ModelDistributionChart
│   │   └── RecentSessions
│   │
│   ├── Sessions Page (/sessions)
│   │   ├── SessionFilters
│   │   ├── SessionList
│   │   └── Pagination
│   │
│   ├── Session Detail Page (/sessions/:id)
│   │   ├── SessionHeader
│   │   ├── SessionMetrics
│   │   └── MessageList
│   │
│   └── Settings Page (/settings)
│       ├── SyncStatus
│       ├── SyncControls
│       └── DatabaseStats
│
└── Query Client Provider (TanStack Query)
```

### URL State Management

TanStack Router manages analytics filters in URL:

```typescript
// URL: /sessions?dateFrom=2025-11-01&dateTo=2025-11-23&page=2

const sessionRoute = createRoute({
  path: '/sessions',
  validateSearch: (search): SessionSearch => ({
    dateFrom: search.dateFrom as string,
    dateTo: search.dateTo as string,
    page: Number(search.page) || 1
  })
})

// In component
function Sessions() {
  const { dateFrom, dateTo, page } = Route.useSearch()

  // Query automatically refetches when URL changes
  const { data } = useQuery({
    queryKey: ['sessions', { dateFrom, dateTo, page }],
    queryFn: () => api.sessions.list({ dateFrom, dateTo, page })
  })
}
```

**Benefits**:
- Shareable URLs
- Browser back/forward works
- Deep linking to filtered views

## Backend Architecture

### API Design Principles

1. **RESTful Conventions**
   - `GET` for reading data
   - `POST` for creating/triggering actions
   - Consistent URL structure

2. **Consistent Response Format**
   ```typescript
   // Success
   { success: true, data: { ... } }

   // Error
   { success: false, error: { message, code, details } }
   ```

3. **Query Parameters for Filtering**
   ```
   GET /api/analytics/sessions?dateFrom=2025-11-01&dateTo=2025-11-23&limit=20
   ```

### Service Layer Pattern

```typescript
// Route Handler (thin, delegates to service)
async function getOverview(request: FastifyRequest) {
  const { dateFrom, dateTo } = request.query
  const analytics = new AnalyticsService(db)
  const overview = await analytics.getOverview({ dateFrom, dateTo })
  return { success: true, data: overview }
}

// Service (business logic, orchestration)
class AnalyticsService {
  async getOverview(filters: DateFilters) {
    const sessions = await this.queryBuilder.getTotalSessions(filters)
    const cost = await this.queryBuilder.getTotalCost(filters)
    const tokens = await this.queryBuilder.getTotalTokens(filters)

    return { sessions, cost, tokens }
  }
}

// Query Builder (data access abstraction)
class AnalyticsQueryBuilder {
  async getTotalSessions(filters: DateFilters) {
    return this.db.query(`
      SELECT COUNT(*) FROM sessions
      WHERE start_time BETWEEN $1 AND $2
    `, [filters.dateFrom, filters.dateTo])
  }
}
```

**Benefits**:
- **Separation of concerns**: Routes, business logic, data access
- **Testability**: Easy to unit test services
- **Reusability**: Query builder used across multiple services

### Error Handling Strategy

```typescript
// Global error handler
app.setErrorHandler((error, request, reply) => {
  // Log error
  console.error('[ERROR]', error)

  // Determine error type
  if (error.statusCode === 400) {
    return reply.status(400).send({
      success: false,
      error: { message: error.message, code: 'VALIDATION_ERROR' }
    })
  }

  // Database errors
  if (error.code?.startsWith('23')) {
    return reply.status(409).send({
      success: false,
      error: { message: 'Database constraint violation', code: 'DB_ERROR' }
    })
  }

  // Generic error
  return reply.status(500).send({
    success: false,
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' }
  })
})
```

## Design Philosophy

### Privacy First

All data processing happens locally:
- ✅ Data stored in local PostgreSQL
- ✅ No external API calls
- ✅ No telemetry or tracking
- ✅ User owns all data

### Type Safety

End-to-end TypeScript:
```typescript
// Shared types
interface Session {
  id: string
  startTime: Date
  cost: number
}

// Backend API returns typed data
async function getSessions(): Promise<Session[]> { ... }

// Frontend receives typed data
const { data } = useQuery<Session[]>({ ... })

// Components receive typed props
function SessionList({ sessions }: { sessions: Session[] }) { ... }
```

### Performance

Optimizations throughout the stack:

**Database**:
- Indexes on frequently queried columns
- Denormalized metrics table
- Connection pooling

**Backend**:
- Fastify (one of the fastest Node.js frameworks)
- Efficient SQL queries
- Incremental sync (only process new/modified files)

**Frontend**:
- TanStack Query caching (reduces API calls)
- Vite's fast HMR
- Code splitting with lazy loading
- Optimized re-renders with React.memo

### User Experience

Smooth, responsive interactions:
- Loading states for all async operations
- Error boundaries for graceful failures
- Optimistic updates where appropriate
- Real-time progress for sync operations

### Developer Experience

Modern tooling:
- TypeScript for type safety
- Hot reload for instant feedback
- Comprehensive DevTools (React, TanStack Query)
- Clear error messages
- Automated testing

## Performance Considerations

### Query Optimization

```sql
-- ✅ Good: Use indexes
SELECT * FROM sessions
WHERE start_time > '2025-11-01'
ORDER BY start_time DESC
LIMIT 20;
-- Uses: idx_sessions_start_time

-- ❌ Bad: Unindexed columns
SELECT * FROM sessions
WHERE LOWER(project_path) LIKE '%project%';
-- Full table scan!
```

### Caching Strategy

**TanStack Query Configuration**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      cacheTime: 10 * 60 * 1000,   // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})
```

**Cache Invalidation**:
```typescript
// After sync completes
queryClient.invalidateQueries({ queryKey: ['analytics'] })
queryClient.invalidateQueries({ queryKey: ['sessions'] })
```

### Bundle Size Optimization

- Tree-shaking with Vite
- Dynamic imports for routes
- Recharts imported selectively
- Production builds minified

### Database Connection Pooling

```typescript
const pool = new Pool({
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000
})
```

## Future Architecture Considerations

### Scalability

Current architecture supports:
- ✅ Thousands of sessions
- ✅ Millions of messages
- ✅ Multiple projects

For larger scale:
- Consider partitioning by date
- Add read replicas
- Implement materialized views for complex aggregations

### Real-time Updates

Current: Manual sync with refresh

Potential: WebSocket for live updates when new Claude Code sessions complete

### Multi-user Support

Current: Single-user local deployment

Potential: Add authentication layer, row-level security, multi-tenancy
