# Claude Code Analytics Dashboard

> **Claulytics** - Your personal analytics dashboard for Claude Code CLI usage tracking with beautiful visualizations and detailed insights.

![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)
![Progress](https://img.shields.io/badge/Progress-100%25-brightgreen?style=for-the-badge)
![Claude Code 2.0](https://img.shields.io/badge/Claude%20Code-2.0%20Default-orange?style=for-the-badge)

Track your Claude Code usage patterns, costs, and productivity metrics with this feature-rich analytics dashboard built specifically for individual developers.

## ✨ Key Features

- 📊 **Comprehensive Analytics** - Track sessions, costs, tokens, and model usage with detailed metrics
- 📈 **Interactive Visualizations** - Beautiful charts powered by Recharts with drill-down capabilities
- 🔄 **Real-time Sync** - Advanced data synchronization with progress tracking and error handling
- 🎯 **Smart Filtering** - Date ranges, URL-persistent filters, and seamless navigation
- 🔒 **Privacy First** - All data remains local—no external uploads or sharing
- 🚀 **Claude Code 2.0** - Full support for extended sessions, checkpoints, and subagents
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile viewing
- ⚡ **Fast & Type-safe** - Built with TypeScript, Vite, and modern React patterns

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Claude Code CLI 2.0+ (data source)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/istealersn-dev/claude-code-analytics.git
cd claude-code-analytics

# 2. Install dependencies
npm install
cd frontend && npm install && cd ..

# 3. Set up the database
createdb claude_code_analytics
psql -d claude_code_analytics -f schema.sql

# 4. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 5. Start the application
npm run dev:all
```

**That's it!** Open your browser to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 📖 Usage

### First Time Setup

1. Navigate to **Settings** (`/settings`)
2. Click **"Sync Now"** to import your Claude Code data from `~/.claude/projects`
3. Monitor real-time progress as your sessions are processed
4. View your analytics on the **Dashboard** (`/`)

### Navigation

- **Dashboard** (`/`) - Overview with key metrics and trend charts
- **Sessions** (`/sessions`) - Detailed session list with filtering
- **Session Details** (`/sessions/:id`) - Deep-dive into individual sessions
- **Settings** (`/settings`) - Data sync and configuration

### Features in Action

**Interactive Charts**: Click any data point to filter sessions by date

**Date Filtering**: Use the date range picker (7d, 30d, 90d, custom) for time-based analysis

**Real-time Sync**: Watch progress indicators as new Claude Code data is processed

**Data Quality**: Built-in validation ensures data integrity with automated cleanup

## 🏗️ Tech Stack

**Frontend**: React + TypeScript + Vite + Tailwind CSS + TanStack Router/Query + Recharts

**Backend**: Fastify + TypeScript + PostgreSQL

**DevOps**: Docker + Docker Compose + Vitest + Biome

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed technical information.

## 📚 Documentation

- **[API Reference](docs/API.md)** - Complete API endpoint documentation
- **[Configuration Guide](docs/CONFIGURATION.md)** - Environment setup and deployment scenarios
- **[Development Guide](docs/DEVELOPMENT.md)** - Development workflow and best practices
- **[Architecture Guide](docs/ARCHITECTURE.md)** - Technical architecture and design decisions
- **[Contributing](CONTRIBUTING.md)** - How to contribute to the project

## 🐳 Docker Deployment

```bash
# Quick start with Docker Compose
cp .env.example .env
# Edit .env with your settings

docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for production deployment guides.

## 🔧 Development

```bash
# Start both backend and frontend
npm run dev:all

# Or run separately
npm run dev              # Backend only
npm run dev:frontend     # Frontend only

# Run tests
npm run test

# Build for production
npm run build:all
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development workflow.

## 🗺️ Roadmap

### ✅ Completed (v1.0 - Production Ready)

- ✅ **Phase 1-6**: Complete data pipeline, frontend, analytics, and production deployment
- ✅ **Claude Code 2.0**: Extended sessions, checkpoints, subagents, VS Code integration
- ✅ **Testing Suite**: Comprehensive unit, integration, and E2E tests
- ✅ **Docker**: Production-ready containerization
- ✅ **Claulytics Branding**: Modern UI with enhanced design system

### 🎯 Future Enhancements

- 📤 **Data Export** - CSV, PNG, PDF export capabilities
- 🔔 **Alerts** - Custom metrics and threshold alerts
- 📊 **Advanced Filters** - Project-based and model-based filtering
- 📧 **Reporting** - Automated weekly/monthly reports (optional)
- 🔗 **Integrations** - Slack notifications, webhooks (optional)

See `TODOs.md` for detailed post-launch enhancement plans.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Code of Conduct
- Development setup
- Pull request process
- Code style guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with:
- [Claude Code CLI](https://www.anthropic.com) - Data source and inspiration
- [TanStack](https://tanstack.com) - Router & Query libraries
- [Recharts](https://recharts.org) - Beautiful React charts
- [Fastify](https://fastify.dev) - Fast backend framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first styling

## 🎨 Branding Note

The dashboard features **Claulytics** branding in the UI, while the project repository retains the name "claude-code-analytics" for consistency with existing installations.

---

<div align="center">

**Built with ❤️ for the Claude Code community**

[Report Bug](https://github.com/istealersn-dev/claude-code-analytics/issues) · [Request Feature](https://github.com/istealersn-dev/claude-code-analytics/issues) · [View Docs](docs/)

</div>
