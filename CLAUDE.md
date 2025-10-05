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
- **Charts**: Recharts with curved styling and advanced interactive features
- **Dashboard Builder**: react-grid-layout with drag-and-drop widget management
- **Interactive Features**: Zoom, pan, annotations, and real-time chart comparisons
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
- **Advanced Charts**: Zoom/pan functionality, annotation system, chart comparisons
- **Custom Dashboards**: Drag-and-drop widget builder, template management, multi-dashboard support

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
- **Current Phase**: Phase 5 - Advanced Features & Automation (67% complete)
- **Overall Progress**: 82% complete
- **Next Priority**: Advance to Phase 6 - Production & Deployment

### Development Phases
1. **Phase 1**: Foundation & Data Pipeline ✅ **100% Complete**
2. **Phase 2**: Frontend Foundation & Basic Dashboard ✅ **100% Complete**
3. **Phase 3**: Advanced Analytics & Visualizations ✅ **85% Complete**
4. **Phase 4**: Enhanced Features & Polish ✅ **100% Complete**
5. **Phase 5**: Advanced Features & Automation 🔄 **67% Complete** (5.1-5.2 Complete ✅, 5.3-5.4 Skipped ⏭️, 5.5-5.6 Complete ✅)
6. **Phase 6**: Production & Deployment ⏳ **0% Complete**

### Recent Major Achievements
- ✅ **Phase 5.1-5.2 Complete**: Advanced Trends & Cost Optimization features with production-quality code
- ✅ **Phase 5.5-5.6 Complete**: Interactive Charts & Custom Dashboard Builder (September 11, 2025)
- ✅ **Advanced Analytics**: Week-over-week/month-over-month growth analysis, seasonal patterns, anomaly detection
- ✅ **Cost Optimization**: Model efficiency recommendations, budget tracking, expensive session identification
- ✅ **Interactive Charts**: Zoom/pan functionality, annotation system, chart comparisons, real-time updates
- ✅ **Dashboard Builder**: Drag-and-drop widgets, template management, customizable layouts
- ✅ **Architectural Improvements**: Resolved circular dependencies, improved TypeScript coverage
- ✅ **Production Architecture**: Type safety, proper error handling, clean component boundaries

### Immediate Next Steps
1. **Phase 6 Priority**: Production & Deployment preparation
   - Comprehensive testing suite (unit, integration, E2E)
   - Docker containerization finalization with data volume mounting
   - Deployment documentation and procedures
   - Production secrets management and environment configuration
2. **Optional Future Features**: Phase 5.3-5.4 (Automation & Integrations)
   - Automated reporting (weekly summaries, cost reports)
   - External integrations (Slack notifications, email reports)

## Future Considerations

- Performance optimizations (query caching, virtual scrolling, bundle optimization) ✅ **COMPLETED**
- Mobile and tablet responsive design improvements ✅ **COMPLETED**
- Advanced trend analysis (week-over-week, seasonal patterns, anomaly detection) ✅ **COMPLETED**
- Cost optimization insights and budget tracking ✅ **COMPLETED**
- Interactive charts with zoom, pan, and annotations ✅ **COMPLETED**
- Custom dashboard creation and user-configurable widgets ✅ **COMPLETED**
- Production deployment with Docker containerization 🔄 **IN PROGRESS**
- Comprehensive testing suite (unit, integration, E2E) ⏳ **PENDING**
- Advanced filtering by project/model and search functionality ⏳ **PENDING**
- Automated reporting and external integrations (Slack, email) ⏳ **OPTIONAL**

## Technical Architecture Achievements

- **AnalyticsQueryBuilder**: Centralized database abstraction with comprehensive data quality methods
- **Data Validation System**: Complete data integrity checking with automated cleanup capabilities
- **Interactive Dashboard**: Advanced chart interactions with date filtering and drill-down navigation
- **Interactive Charts**: Zoom/pan functionality, annotation system, chart comparisons with overlay/side-by-side views
- **Dashboard Builder**: Drag-and-drop widget system using react-grid-layout with real-time customization
- **Template Management**: Complete dashboard template system with import/export, preset templates
- **Type Safety**: Full TypeScript coverage with strict mode and proper error handling
- **Circular Dependency Resolution**: Clean module architecture with centralized type definitions
- **Production Ready**: Addressed all automated code review feedback for architectural best practices

## New Interactive Features (Phase 5.5-5.6)

### Interactive Charts (`/charts`)
- **InteractiveLineChart**: Zoom and pan with drag-to-zoom selection, double-click annotations
- **ChartComparison**: Multi-metric overlays, side-by-side, and stacked comparisons
- **ChartBuilder**: Custom chart configuration with real-time preview
- **Chart Controls**: Enable/disable interactions, annotation management, export functionality

### Custom Dashboard Builder (`/dashboard-builder`)
- **DashboardBuilder**: Drag-and-drop widget placement with react-grid-layout
- **Widget Management**: Add, remove, duplicate, and configure chart widgets
- **Property Panel**: Real-time widget customization (title, color, height, data sources)
- **Template System**: Save, load, import, export dashboard configurations
- **Preset Templates**: Executive Summary, Usage Analytics, Cost Optimization dashboards
- **Grid Layout**: Responsive design with mobile-optimized widget arrangements

## Component File Structure (Phase 5.5-5.6)

### Interactive Charts
- `frontend/src/components/charts/InteractiveLineChart.tsx` - Zoom, pan, annotation functionality
- `frontend/src/components/charts/ChartComparison.tsx` - Multi-chart comparison views
- `frontend/src/components/charts/ChartBuilder.tsx` - Custom chart configuration interface
- `frontend/src/routes/charts.tsx` - Interactive charts showcase page

### Dashboard Builder
- `frontend/src/components/dashboard/DashboardBuilder.tsx` - Main drag-and-drop builder
- `frontend/src/components/dashboard/DashboardTemplates.tsx` - Template management system
- `frontend/src/routes/dashboard-builder.tsx` - Dashboard builder route
- `frontend/src/components/ui/tabs.tsx` - Custom tabs component
- `frontend/src/styles/grid-layout.css` - Grid layout styling