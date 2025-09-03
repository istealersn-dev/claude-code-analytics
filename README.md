# Claude Code Analytics Dashboard

A comprehensive personal analytics dashboard for Claude Code CLI usage tracking with beautiful visualizations and detailed insights.

![Claude Code Analytics](https://img.shields.io/badge/Claude%20Code-Analytics-orange?style=for-the-badge)
![Progress](https://img.shields.io/badge/Progress-63%25-green?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## 🚀 Overview

Track your Claude Code usage patterns, costs, and productivity metrics with this feature-rich analytics dashboard. Built specifically for individual developers who want deep insights into their AI-assisted coding sessions.

### ✨ Key Features

- 📊 **Comprehensive Analytics**: Track sessions, costs, tokens, and model usage
- 📈 **Beautiful Visualizations**: Interactive charts with Recharts and custom styling
- 🔄 **Real-time Sync**: Advanced data synchronization with progress tracking
- 🎯 **Interactive Filtering**: Date ranges, drill-down views, and URL-persistent filters  
- 📱 **Responsive Design**: Optimized for desktop and mobile viewing
- 🔒 **Privacy First**: All data remains local - no external uploads or sharing

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Usage](#-usage)
- [Development](#-development)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)

## 🎯 Features

### Data Analytics & Visualization

- **Session Tracking**: Monitor Claude Code conversation sessions with detailed metrics
- **Cost Analysis**: Track spending patterns and daily burn rates
- **Token Analytics**: Input/output token consumption with efficiency metrics
- **Model Distribution**: Usage breakdown across different Claude models
- **Time-series Charts**: Daily usage, cost trends, and session duration patterns
- **Performance Metrics**: Cache hit rates, response times, and tool usage statistics

### Interactive Dashboard

- **Real-time Data**: Live updates with TanStack Query caching
- **Date Range Filtering**: Flexible time-based analysis (7d, 30d, 90d, custom)
- **Chart Interactions**: Click-through from charts to detailed session views
- **Drill-down Views**: Session-level analysis with message details
- **Responsive Layout**: Mobile-optimized grid system

### Advanced Sync Management

- **Progress Tracking**: Real-time sync progress with file-level indicators
- **Error Handling**: Comprehensive error reporting with retry mechanisms
- **Preview Mode**: See pending changes before sync execution
- **Database Stats**: Monitor storage usage and data retention
- **Auto-sync Framework**: UI ready for scheduled synchronization

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Routing**: TanStack Router (type-safe with search params)
- **State Management**: TanStack Query for server state
- **Charts**: Recharts with custom curved styling
- **Backend**: Fastify + TypeScript
- **Database**: PostgreSQL with hybrid normalized schema
- **Data Processing**: Custom JSONL parser for Claude Code files

### Design Philosophy

- **Privacy First**: All data processing happens locally
- **Type Safety**: End-to-end TypeScript with proper interfaces
- **Performance**: Intelligent caching and query optimization  
- **User Experience**: Smooth animations and responsive feedback
- **Developer Experience**: Modern tooling with hot reload and DevTools

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Claude Code CLI (for data source)

### Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/your-username/claude-code-analytics.git
cd claude-code-analytics
```

2. **Install dependencies**

```bash
npm install
cd frontend && npm install && cd ..
```

3. **Set up the database**

```bash
# Create database
createdb claude_code_analytics

# Run schema setup
psql -d claude_code_analytics -f schema.sql
```

4. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. **Start the application**

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend  
cd frontend && npm run dev
```

6. **Access the dashboard**

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3001>

### Environment Configuration

Create a `.env` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=claude_code_analytics

# Application Settings
NODE_ENV=development
API_PORT=3001

# Data Settings
CLAUDE_DATA_PATH=~/.claude/projects
DATA_RETENTION_DAYS=90
```

## 📖 Usage

### Initial Data Sync

1. **Navigate to Settings** (`/settings`)
2. **Click "Sync Now"** to import your Claude Code data
3. **Monitor Progress** with the real-time progress indicator
4. **Review Results** in the sync status dashboard

### Dashboard Navigation

- **Home Dashboard** (`/`): Overview with key metrics and trend charts
- **Sessions** (`/sessions`): Detailed session list with filtering
- **Session Details** (`/sessions/:id`): Individual session analysis
- **Settings** (`/settings`): Data sync and application preferences

### Interactive Features

#### Chart Navigation

- Click any data point on time-series charts to filter sessions by date
- Use the date range picker for custom time periods
- Navigate from dashboard charts directly to filtered session lists

#### Session Analysis

- Filter sessions by date range, project, or model
- View detailed message-level analytics
- Track token usage and costs per session
- Monitor tool usage and cache performance

#### Data Management

- Real-time sync with progress tracking
- Preview pending changes before processing
- Comprehensive error reporting and resolution
- Database statistics and storage monitoring

## 🔧 Development

### Project Structure

```
claude-code-analytics/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components  
│   │   ├── routes/          # TanStack Router pages
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript interfaces
├── src/                     # Backend application
│   ├── server/              # Fastify server and routes
│   ├── database/            # Database utilities and queries
│   ├── parsers/             # JSONL data parsing
│   ├── services/            # Business logic services
│   └── types/               # Shared TypeScript types
├── schema.sql               # Database schema definition
└── package.json             # Backend dependencies
```

### Development Workflow

#### Available Scripts

```bash
# Backend
npm run dev                  # Start backend in development mode
npm run build               # Build TypeScript to JavaScript
npm run start               # Run built application
npm test                    # Run parser tests

# Frontend  
cd frontend
npm run dev                 # Start Vite development server
npm run build               # Build for production
npm run preview             # Preview production build

# Database
npm run db:reset            # Reset database schema
npm run db:connect          # Connect to PostgreSQL
```

#### Code Style & Quality

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Linting**: Biome for consistent code formatting
- **Conventions**:
  - camelCase for variables/functions
  - PascalCase for components/types
  - kebab-case for files/CSS classes

#### Adding New Features

1. **Plan the feature** in the appropriate phase (see development phases)
2. **Create feature branch** from `main`
3. **Implement with tests** (backend logic should include test files)
4. **Update documentation** including this README if needed
5. **Submit pull request** with detailed description

### Development Phases

The project follows a structured development approach:

- ✅ **Phase 1**: Foundation & Data Pipeline (100%)
- ✅ **Phase 2**: Frontend Foundation (100%)  
- ✅ **Phase 3**: Advanced Analytics (85%)
- 🚧 **Phase 4**: Enhanced Features (25% - Sync interface complete)
- ⏳ **Phase 5**: Advanced Features & Automation
- ⏳ **Phase 6**: Production & Deployment

## 📡 API Reference

### Analytics Endpoints

```http
GET /api/analytics/overview
GET /api/analytics/sessions?dateFrom=&dateTo=&limit=20&offset=0
GET /api/analytics/sessions/:id
GET /api/analytics/daily-usage?dateFrom=&dateTo=
GET /api/analytics/model-distribution?dateFrom=&dateTo=
GET /api/analytics/tool-usage?dateFrom=&dateTo=
```

### Sync Management

```http
GET /api/sync/status          # Current sync status
GET /api/sync/preview         # Preview pending changes
GET /api/sync/stats          # Database statistics
POST /api/sync/run           # Start data synchronization
POST /api/sync/reset         # Reset sync metadata
```

### Request/Response Examples

#### Get Overview Analytics

```json
GET /api/analytics/overview

{
  "success": true,
  "data": {
    "totalSessions": 1234,
    "totalCost": 45.67,
    "totalTokens": 567890,
    "avgSessionDuration": 1200,
    "topModels": [...]
  }
}
```

#### Start Data Sync

```json
POST /api/sync/run
Content-Type: application/json

{
  "incremental": true,
  "dryRun": false
}
```

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Add TypeScript types for all new interfaces
- Include tests for backend functionality
- Update documentation for significant changes
- Ensure responsive design for frontend components

### Reporting Issues

Please use the GitHub issue tracker to report bugs or request features. Include:

- Clear description of the issue or feature request
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Claude Code CLI** for providing the data source and inspiration
- **TanStack** for excellent React tooling (Router & Query)
- **Recharts** for beautiful and flexible chart components
- **Fastify** for fast and efficient backend framework
- **Tailwind CSS** for utility-first styling approach

---

<div align="center">

**Built with ❤️ for the Claude Code community**

[Report Bug](https://github.com/your-username/claude-code-analytics/issues) · [Request Feature](https://github.com/your-username/claude-code-analytics/issues) · [Documentation](https://github.com/your-username/claude-code-analytics/wiki)

</div>
