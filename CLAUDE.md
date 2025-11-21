# Claude Code Analytics Dashboard

Personal usage analytics dashboard for Claude Code CLI with beautiful visualizations and detailed usage tracking.

## Project Overview
- **Purpose**: Track personal Claude Code usage patterns, costs, and productivity metrics
- **Scope**: Individual developer analytics (not team/enterprise)
- **Data Source**: Local JSONL files from `~/.claude/projects/`
- **Privacy**: All data remains local - no external uploads or sharing

## Architecture Decisions
- **Database**: PostgreSQL with hybrid normalized approach
- **Frontend**: Vite + React + TypeScript + Tailwind CSS v3 (reverted from v4 for stability)
- **Backend**: Fastify server with comprehensive API endpoints
- **Routing**: TanStack Router for type-safe navigation and search params
- **Data Fetching**: TanStack Query for server state management and caching
- **Charts**: Recharts with curved styling for visualizations
- **Data Retention**: 90 days (configurable)
- **Update Strategy**: Manual sync with incremental data processing and real-time sync interface

## TanStack Technologies

### TanStack Router Benefits
- **100% Type Safety**: Full TypeScript inference for routes, params, and search state
- **First-Class Search Params**: Perfect for analytics filters (date ranges, metrics, etc.)
- **Built-in Caching**: Route-level data loading with intelligent cache management
- **Nested Routing**: Clean organization for dashboard sections and drill-down views
- **File-Based Routing**: Intuitive project structure with type generation

### TanStack Query Benefits
- **Server State Management**: Excellent for analytics data fetching and caching
- **Background Refetching**: Keep dashboard data fresh automatically
- **Optimistic Updates**: Smooth UX when syncing new Claude Code data
- **Query Invalidation**: Smart cache updates when data changes
- **Request Deduplication**: Efficient data loading across components
- **Built-in DevTools**: Powerful debugging for data flow

### Why This Stack for Analytics
- **Search-Driven**: URL state for shareable dashboard views and filters
- **Performance**: Intelligent caching reduces unnecessary API calls
- **Type Safety**: Catch errors at compile time, not runtime
- **Developer Experience**: Excellent DevTools and TypeScript integration
- **Composability**: Perfect for complex dashboard interactions

## Code Conventions
- **Variables/Functions**: camelCase (`getUserSessions`, `parseTokenData`)
- **Components/Types**: PascalCase (`SessionChart`, `UserMetrics`, `DashboardProps`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETENTION_DAYS`, `DEFAULT_CHART_HEIGHT`)
- **Files/CSS**: kebab-case (`session-chart.tsx`, `.chart-container`)
- **Database Columns**: snake_case (`created_at`, `token_count`, `session_id`)

## Component Patterns
- **Single Responsibility**: Each component has one clear purpose
- **Explicit Props**: All props defined with TypeScript interfaces
- **Default Props**: Provide sensible defaults for optional values
- **Error Boundaries**: Wrap chart components for graceful failures
- **Composition**: Prefer composition over inheritance for reusability

## Design System
- **Primary Color**: Orange (#FF6B35) for highlights and call-to-actions
- **Background**: Black shade gradients for modern, sleek appearance
- **Typography**: Clean, readable fonts with proper hierarchy
- **Charts**: Smooth curved lines, elegant transitions, engaging visualizations
- **Layout**: Grid-based dashboard with responsive design

## Key Metrics Tracked
- **Cost Analytics**: Total spend, daily burn rate, cost per session with comprehensive visualizations
- **Usage Patterns**: Sessions, tokens (input/output), model distribution with interactive pie charts
- **Performance**: Session duration, tools used, cache hit rates with time-series analysis
- **Trends**: Daily/weekly usage patterns, historical comparisons with date range filtering
- **Data Quality**: Duplicate detection, missing data identification, integrity scoring
- **Interactive Features**: URL-persisted filters, real-time sync status

## Error Handling Philosophy
- **Fail Fast**: Stop execution with clear error messages when critical issues occur
- **Descriptive Messages**: Tell users exactly what went wrong and how to fix it
- **Data Validation**: Validate JSONL structure before processing
- **Graceful Degradation**: Show partial data when some files are corrupted

## Development Workflow
- **Commits**: Conventional commit patterns (feat:, fix:, refactor:, chore:)
- **Code Review**: Greptile integration for automated code review and production readiness
- **Quality Assurance**: TypeScript strict mode, Biome linting, comprehensive error boundaries
- **Architecture**: Query builder abstraction, proper type safety, user confirmation dialogs
- **Iteration**: MVP-first approach with progressive enhancement and architectural improvements
- **Documentation**: Comprehensive phase tracking, session summaries, and architectural decisions

## Database Schema Strategy
- **sessions**: Core session metadata and timing
- **session_metrics**: Flattened analytics data for fast queries  
- **raw_messages**: Detailed conversation data for drill-down analysis
- **Hybrid Approach**: Balance between query performance and data integrity

## Current Development Status
- **Current Phase**: All phases complete - Production ready
- **Overall Progress**: 100% complete
- **Status**: Production-ready with optional Claude Code 2.0 enhancements

### Development Phases
1. **Phase 1**: Foundation & Data Pipeline ✅ **100% Complete**
2. **Phase 2**: Frontend Foundation & Basic Dashboard ✅ **100% Complete**
3. **Phase 3**: Advanced Analytics & Visualizations ✅ **85% Complete**
4. **Phase 4**: Enhanced Features & Polish ✅ **100% Complete**
5. **Phase 5**: Advanced Features & Automation ✅ **50% Complete** (5.1-5.2 Complete ✅, 5.3-5.6 Skipped ⏭️)
6. **Phase 6**: Production & Deployment ✅ **100% Complete** (Merged PR #14, December 2024)

### Recent Major Achievements
- ✅ **Claude Code 2.0 Default** (November 2025): CC2 is now the standard - removed legacy CC1 support
- ✅ **Sync UI & Schema Compatibility** (November 2025 - PR #15): Improved sync interface and schema compatibility
- ✅ **Phase 6 Complete** (December 2024 - PR #14): Production deployment with Claude Code 2.0 features
- ✅ **Claude Code 2.0 Features**: Extended session handling, checkpoints, background tasks, subagent tracking, VS Code integration
- ✅ **Testing Suite**: Comprehensive unit, integration, and E2E tests with Vitest and Playwright
- ✅ **Docker Deployment**: Production-ready containerization with optional CC2 schema
- ✅ **Phase 5.1-5.2 Complete**: Advanced Trends & Cost Optimization features
- ✅ **Code Quality Overhaul** (October 2025 - PR #13): Zero TypeScript/ESLint errors
- ✅ **Documentation Cleanup** (November 2025): Consolidated from 14 to 3 essential docs

### Optional Enhancements (Post-Launch)
1. **Phase 5.3-5.4 Features** (Optional):
   - Automated reporting (weekly summaries, cost reports)
   - External integrations (Slack notifications, email reports)
2. **Additional Features**: See TODOs.md "Post-Launch Enhancements" section

## Future Considerations

### Completed ✅
- Performance optimizations (query caching, virtual scrolling, bundle optimization)
- Mobile and tablet responsive design improvements
- Advanced trend analysis (week-over-week, seasonal patterns, anomaly detection)
- Cost optimization insights and budget tracking
- Production deployment with Docker containerization
- Comprehensive testing suite (unit, integration, E2E)
- Claude Code 2.0 features (extended sessions, checkpoints, subagents, VS Code integration)
- Real-time sync status with WebSocket (inline UI display)

### Future Enhancements ⏳
See TODOs.md "Post-Launch Enhancements" section for:
- Data export (CSV, PNG, PDF)
- Advanced filtering by project/model
- Custom metrics and alerts
- Automated reporting and external integrations

## Technical Architecture Achievements

- **Claude Code 2.0 Schema**: Comprehensive database schema supporting all CC2 features
- **AnalyticsQueryBuilder**: Centralized database abstraction with comprehensive data quality methods
- **Data Validation System**: Complete data integrity checking with automated cleanup capabilities
- **Interactive Dashboard**: Chart visualizations with date filtering and data exploration
- **Real-Time Sync Status**: WebSocket-based live updates with inline status display
- **Testing Suite**: Comprehensive unit, integration, and E2E tests with Vitest and Playwright
- **Claude Code 2.0 Support**: Optional extended session handling, checkpoints, subagents, background tasks
- **Docker Deployment**: Multi-stage builds, health checks, production secrets management
- **Type Safety**: Full TypeScript coverage with strict mode and proper error handling
- **Production Ready**: Zero compilation errors, clean architecture, optimized builds

## Key Files Reference

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