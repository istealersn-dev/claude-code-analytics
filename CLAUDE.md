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
- **Charts**: Recharts with curved styling for engaging visualizations
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
- **Interactive Features**: Chart drill-down navigation, URL-persisted filters, real-time sync status

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
- **Current Phase**: Phase 4 - Enhanced Features & Polish (50% complete)
- **Overall Progress**: 66% complete
- **Next Priority**: Complete remaining Phase 4 features (Performance optimizations & Responsive design) or advance to Phase 5

### Development Phases
1. **Phase 1**: Foundation & Data Pipeline ✅ **100% Complete**
2. **Phase 2**: Frontend Foundation & Basic Dashboard ✅ **100% Complete**
3. **Phase 3**: Advanced Analytics & Visualizations ✅ **85% Complete**
4. **Phase 4**: Enhanced Features & Polish 🚀 **50% Complete** (Data Sync ✅, Data Validation ✅)
5. **Phase 5**: Advanced Features & Automation ⏳ **0% Complete**
6. **Phase 6**: Production & Deployment ⏳ **0% Complete**

### Recent Major Achievements
- ✅ **Data Validation & Cleanup System**: Complete data quality dashboard with automated cleanup
- ✅ **Production Architecture**: Addressed all Greptile code review feedback for production readiness
- ✅ **Advanced Analytics**: Interactive charts with date filtering and drill-down capabilities
- ✅ **Data Sync Interface**: Manual sync with progress indicators and error reporting
- ✅ **TypeScript & Quality**: Full type safety across entire codebase with comprehensive error handling

### Immediate Next Steps
1. Complete Phase 4 remaining features (Performance optimizations & Responsive design)
2. Begin Phase 5 - Advanced Features & Automation
3. Implement trend analysis and cost optimization insights
4. Consider production deployment preparation

## Future Considerations

- Performance optimizations (query caching, virtual scrolling, bundle optimization)
- Mobile and tablet responsive design improvements
- Advanced trend analysis (week-over-week, seasonal patterns, anomaly detection)
- Cost optimization insights and budget tracking
- Automated reporting and external integrations (Slack, email)
- Custom dashboard creation and user-configurable widgets
- Production deployment with Docker containerization
- Comprehensive testing suite (unit, integration, E2E)
- Advanced filtering by project/model and search functionality

## Technical Architecture Achievements

- **AnalyticsQueryBuilder**: Centralized database abstraction with comprehensive data quality methods
- **Data Validation System**: Complete data integrity checking with automated cleanup capabilities
- **Interactive Dashboard**: Advanced chart interactions with date filtering and drill-down navigation
- **Type Safety**: Full TypeScript coverage with strict mode and proper error handling
- **Production Ready**: Addressed all automated code review feedback for architectural best practices