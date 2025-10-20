# Claude Code Analytics - AI Agent Context

## Project Overview

**Claude Code Analytics** is a comprehensive personal usage analytics dashboard for Claude Code CLI with beautiful visualizations and detailed usage tracking. This is a **personal developer tool** (not enterprise) that processes local JSONL files from `~/.claude/projects/` to provide insights into AI-assisted coding sessions.

### Key Characteristics
- **Privacy First**: All data remains local - no external uploads or sharing
- **Personal Analytics**: Individual developer usage patterns, costs, and productivity metrics
- **Data Source**: Local JSONL files from Claude Code CLI sessions
- **Current Status**: 82% complete, Phase 6 (Production & Deployment) is the next priority

## Architecture & Tech Stack

### Backend (Node.js/TypeScript)
- **Framework**: Fastify server with comprehensive API endpoints
- **Database**: PostgreSQL with hybrid normalized approach
- **Data Processing**: Custom JSONL parser for Claude Code files
- **Location**: `src/` directory with transpiled output in `dist/`

### Frontend (React/TypeScript)
- **Framework**: Vite + React + TypeScript + Tailwind CSS v3
- **Routing**: TanStack Router for type-safe navigation and search params
- **State Management**: TanStack Query for server state management and caching
- **Charts**: Recharts with curved styling and advanced interactive features
- **Dashboard Builder**: react-grid-layout with drag-and-drop widget management
- **Location**: `frontend/` directory

### Key Technologies
- **TanStack Router**: 100% type safety, first-class search params, built-in caching
- **TanStack Query**: Server state management, background refetching, optimistic updates
- **Recharts**: Interactive charts with zoom, pan, annotations, and comparisons
- **PostgreSQL**: Hybrid normalized schema for performance and data integrity

## Project Structure

```
claude-code-analytics/
├── src/                          # Backend TypeScript source
│   ├── server/                   # Fastify HTTP layer
│   │   ├── config/               # Middleware configuration
│   │   └── routes/               # API endpoints
│   ├── services/                 # Business logic
│   ├── database/                 # Query builders and connection
│   ├── parsers/                  # Claude Code JSONL ingestion
│   ├── utils/                    # Utility functions
│   └── types/                    # TypeScript type definitions
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── charts/           # Chart components
│   │   │   ├── dashboard/        # Dashboard components
│   │   │   └── ui/               # UI components
│   │   ├── routes/               # TanStack Router pages
│   │   ├── hooks/                # Custom React hooks
│   │   └── lib/                  # API client and utilities
├── dist/                         # Transpiled backend output
├── schema.sql                    # Database schema
└── docker-compose.yml            # Container orchestration
```

## Development Phases & Current Status

### Completed Phases (100%)
1. **Phase 1**: Foundation & Data Pipeline ✅
   - JSONL parser, database insertion, data synchronization
   - Database utilities, API foundation, error handling

2. **Phase 2**: Frontend Foundation & Basic Dashboard ✅
   - Vite + React setup, design system, routing
   - Basic analytics widgets, Recharts integration

3. **Phase 3**: Advanced Analytics & Visualizations ✅
   - Time-series charts, distribution charts, performance metrics
   - Interactive filtering, drill-down capabilities

4. **Phase 4**: Enhanced Features & Polish ✅
   - Data sync interface, data validation & cleanup
   - Performance optimizations, responsive design

### Current Phase (67% Complete)
5. **Phase 5**: Advanced Features & Automation 🔄
   - ✅ 5.1-5.2: Advanced analytics, trend analysis, cost optimization
   - ⏭️ 5.3-5.4: Automation & integrations (SKIPPED for Phase 6 priority)
   - ✅ 5.5-5.6: Interactive charts, custom dashboard builder

### Next Priority (0% Complete)
6. **Phase 6**: Production & Deployment ⏳
   - Comprehensive testing suite (unit, integration, E2E)
   - Docker containerization finalization
   - Documentation and deployment procedures
   - Production secrets management

## Key Features & Capabilities

### Analytics & Visualizations
- **Session Tracking**: Monitor Claude Code conversation sessions with detailed metrics
- **Cost Analysis**: Track spending patterns, daily burn rates, model efficiency
- **Token Analytics**: Input/output token consumption with efficiency metrics
- **Model Distribution**: Usage breakdown across different Claude models
- **Time-series Charts**: Daily usage, cost trends, session duration patterns
- **Performance Metrics**: Cache hit rates, response times, tool usage statistics

### Interactive Dashboard
- **Real-time Data**: Live updates with TanStack Query caching
- **Date Range Filtering**: Flexible time-based analysis (7d, 30d, 90d, custom)
- **Chart Interactions**: Click-through from charts to detailed session views
- **Drill-down Views**: Session-level analysis with message details
- **Responsive Layout**: Mobile-optimized grid system

### Advanced Features (Phase 5.5-5.6)
- **Interactive Charts**: Zoom/pan functionality, annotation system, chart comparisons
- **Custom Dashboard Builder**: Drag-and-drop widgets, template management
- **Chart Builder**: Custom chart configuration with real-time preview
- **Template System**: Save, load, import, export dashboard configurations

### Data Management
- **Progress Tracking**: Real-time sync progress with file-level indicators
- **Error Handling**: Comprehensive error reporting with retry mechanisms
- **Data Quality**: Duplicate detection, missing data identification, integrity scoring
- **Retention Policy**: 90-day data retention with automated cleanup

## API Endpoints

### Core Analytics
- `GET /api/analytics/overview` - Dashboard summary metrics
- `GET /api/analytics/costs` - Cost analysis and trends
- `GET /api/analytics/tokens` - Token usage analysis
- `GET /api/analytics/sessions` - Sessions list with pagination

### Data Management
- `GET /api/sync/status` - Sync status and progress
- `POST /api/sync/run` - Run data synchronization
- `GET /api/data-quality/overview` - Data quality metrics
- `POST /api/retention/clean` - Run data cleanup

### Advanced Features
- `GET /api/trends/growth` - Week-over-week growth analysis
- `GET /api/trends/cost-optimization` - Cost optimization insights
- `GET /api/health` - System health check

## Database Schema

### Core Tables
- **sessions**: Core session metadata and timing
- **session_metrics**: Flattened analytics data for fast queries
- **raw_messages**: Detailed conversation data for drill-down analysis
- **sync_metadata**: Data synchronization tracking

### Key Relationships
- Sessions → Session Metrics (1:many)
- Sessions → Raw Messages (1:many)
- Hybrid approach balancing query performance and data integrity

## Development Commands

### Backend Development
```bash
npm run dev              # Start API server (port 3001)
npm run build            # Build TypeScript
npm run start            # Start production server
```

### Frontend Development
```bash
npm run dev:frontend     # Start Vite dev server (port 5173)
npm run build:frontend   # Build frontend assets
```

### Full Stack Development
```bash
npm run dev:all          # Start both backend and frontend
npm run build:all        # Build both backend and frontend
```

### Database Operations
```bash
npm run db:reset         # Reset database with schema
npm run db:connect       # Connect to PostgreSQL
```

### Docker Development
```bash
docker-compose up --build    # Start full stack with Docker
docker-compose down          # Stop all services
```

## Code Conventions

### Naming Conventions
- **Variables/Functions**: camelCase (`getUserSessions`, `parseTokenData`)
- **Components/Types**: PascalCase (`SessionChart`, `UserMetrics`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETENTION_DAYS`)
- **Files/CSS**: kebab-case (`session-chart.tsx`, `.chart-container`)
- **Database Columns**: snake_case (`created_at`, `token_count`)

### Code Quality
- **TypeScript**: Strict mode with explicit return types
- **Linting**: Biome for formatting and code quality
- **Error Handling**: Comprehensive error boundaries and null checks
- **Testing**: Unit, integration, and E2E tests (Phase 6 priority)

## Current Development Priorities

### Immediate Next Steps (Phase 6)
1. **Comprehensive Testing Suite**
   - Unit tests for data processing and business logic
   - Integration tests for API endpoints
   - E2E tests for dashboard functionality
   - Performance testing and optimization

2. **Docker Deployment Finalization**
   - Data volume mounting for `~/.claude/projects`
   - Production secrets management
   - Environment configuration
   - Health checks and monitoring

3. **Documentation**
   - User setup and installation guide
   - Developer documentation
   - Deployment procedures
   - API documentation

### Optional Future Features (Phase 5.3-5.4)
- Automated reporting (weekly summaries, cost reports)
- External integrations (Slack notifications, email reports)
- Webhook support for custom integrations

## Key Files for AI Agents

### Critical Backend Files
- `src/server/app.ts` - Fastify server configuration
- `src/database/query-builder.ts` - Analytics query abstraction
- `src/services/data-sync.ts` - Data synchronization service
- `src/parsers/jsonl-parser.ts` - Claude Code JSONL parser

### Critical Frontend Files
- `frontend/src/routes/index.tsx` - Main dashboard page
- `frontend/src/hooks/useAnalytics.ts` - Data fetching hooks
- `frontend/src/components/charts/` - Chart components
- `frontend/src/lib/api.ts` - API client

### Configuration Files
- `schema.sql` - Database schema
- `docker-compose.yml` - Container orchestration
- `package.json` - Backend dependencies
- `frontend/package.json` - Frontend dependencies

## Error Handling Philosophy

- **Fail Fast**: Stop execution with clear error messages when critical issues occur
- **Descriptive Messages**: Tell users exactly what went wrong and how to fix it
- **Data Validation**: Validate JSONL structure before processing
- **Graceful Degradation**: Show partial data when some files are corrupted

## Design System

- **Primary Color**: Orange (#FF6B35) for highlights and call-to-actions
- **Background**: Black shade gradients for modern, sleek appearance
- **Typography**: Clean, readable fonts with proper hierarchy
- **Charts**: Smooth curved lines, elegant transitions, engaging visualizations
- **Layout**: Grid-based dashboard with responsive design

## Git Workflow

- **Commits**: Conventional commit patterns (feat:, fix:, refactor:, chore:)
- **Code Review**: Greptile integration for automated code review
- **Quality Assurance**: TypeScript strict mode, Biome linting
- **Architecture**: Query builder abstraction, proper type safety

---

*This document provides comprehensive context for AI agents working on the Claude Code Analytics project. The project is in Phase 6 (Production & Deployment) with 82% overall completion. Focus should be on testing, documentation, and deployment preparation.*