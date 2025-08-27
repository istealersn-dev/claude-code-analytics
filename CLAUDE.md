# Claude Code Analytics Dashboard

Personal usage analytics dashboard for Claude Code CLI with beautiful visualizations and detailed usage tracking.

## Project Overview
- **Purpose**: Track personal Claude Code usage patterns, costs, and productivity metrics
- **Scope**: Individual developer analytics (not team/enterprise)
- **Data Source**: Local JSONL files from `~/.claude/projects/`
- **Privacy**: All data remains local - no external uploads or sharing

## Architecture Decisions
- **Database**: PostgreSQL with hybrid normalized approach
- **Frontend**: Vite + React + TypeScript + Tailwind v4
- **Routing**: TanStack Router for type-safe navigation and search params
- **Data Fetching**: TanStack Query for server state management and caching
- **Charts**: Recharts with curved styling for engaging visualizations
- **Data Retention**: 90 days (configurable)
- **Update Strategy**: Manual sync with incremental data processing

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
- **Cost Analytics**: Total spend, daily burn rate, cost per session
- **Usage Patterns**: Sessions, tokens (input/output), model distribution
- **Performance**: Session duration, tools used, cache hit rates
- **Trends**: Daily/weekly usage patterns, historical comparisons

## Error Handling Philosophy
- **Fail Fast**: Stop execution with clear error messages when critical issues occur
- **Descriptive Messages**: Tell users exactly what went wrong and how to fix it
- **Data Validation**: Validate JSONL structure before processing
- **Graceful Degradation**: Show partial data when some files are corrupted

## Development Workflow
- **Commits**: Conventional commit patterns (feat:, fix:, refactor:, chore:)
- **Iteration**: Build MVP first, enhance progressively
- **No Testing**: Focus on functionality for MVP, add tests later
- **Documentation**: Update this file as architecture evolves

## Database Schema Strategy
- **sessions**: Core session metadata and timing
- **session_metrics**: Flattened analytics data for fast queries  
- **raw_messages**: Detailed conversation data for drill-down analysis
- **Hybrid Approach**: Balance between query performance and data integrity

## Current Development Status
- **Current Phase**: Phase 1 - Foundation & Data Pipeline (25% complete)
- **Overall Progress**: 4% complete
- **Next Priority**: Phase 1.1 - Create Claude Code JSONL parser

### Development Phases
1. **Phase 1**: Foundation & Data Pipeline (Database ✅, Parser ⏳)
2. **Phase 2**: Frontend Foundation & Basic Dashboard  
3. **Phase 3**: Advanced Analytics & Visualizations
4. **Phase 4**: Enhanced Features & Polish
5. **Phase 5**: Advanced Features & Automation
6. **Phase 6**: Production & Deployment

### Immediate Next Steps
1. Create Claude Code JSONL parser with validation
2. Set up TypeScript interfaces for data models  
3. Implement basic data ingestion pipeline
4. Create sample data for development and testing

## Future Considerations
- Export capabilities (CSV, JSON)
- Advanced filtering and search
- Comparison views (week-over-week, month-over-month)
- Alerting for usage spikes or budget limits
- Integration with other Claude Code workflows