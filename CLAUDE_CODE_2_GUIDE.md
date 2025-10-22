# Claude Code Analytics 2.0 - Complete Guide

## Overview

Claude Code Analytics 2.0 is a comprehensive analytics dashboard designed to track and analyze your Claude Code CLI usage, now with full support for Claude Code 2.0's advanced features including checkpoints, background tasks, subagents, VS Code integration, and extended autonomous sessions.

## 🚀 Claude Code 2.0 Features Supported

### 1. Checkpoints & Rewind Functionality
- **Automatic Checkpoint Detection**: Tracks when Claude creates checkpoints during development
- **Rewind Analytics**: Monitors how often you use the `/rewind` command or Escape+Escape
- **Checkpoint Efficiency**: Measures the effectiveness of your checkpoint usage
- **Timeline Visualization**: See checkpoint creation patterns over time

### 2. Background Tasks
- **Long-Running Process Tracking**: Monitors background tasks that run for extended periods
- **Task Type Analysis**: Categorizes tasks by type (code generation, testing, refactoring, documentation)
- **Progress Monitoring**: Tracks task completion rates and efficiency
- **Resource Usage**: Analyzes token consumption and costs for background tasks

### 3. Subagents for Parallel Development
- **Multi-Agent Tracking**: Monitors multiple subagents working simultaneously
- **Agent Type Analysis**: Tracks different subagent specializations (frontend, backend, testing, etc.)
- **Parallel Development Metrics**: Measures efficiency of parallel development workflows
- **Task Distribution**: Analyzes how work is distributed across subagents

### 4. VS Code Integration
- **Extension Usage**: Tracks VS Code extension interactions
- **File Operations**: Monitors file modifications and operations
- **Diff Views**: Tracks inline diff viewing and code review
- **Sidebar Interactions**: Monitors sidebar panel usage and navigation

### 5. Extended Autonomous Sessions
- **30+ Hour Session Support**: Handles long-running autonomous development sessions
- **Autonomy Level Tracking**: Measures AI autonomy on a 0-10 scale
- **Session Type Classification**: Categorizes sessions as standard, extended, or autonomous
- **Memory Optimization**: Efficiently processes large datasets from extended sessions

## 📊 Enhanced Analytics Dashboard

### New Widgets & Metrics

#### Checkpoint Analytics
- **Total Checkpoints**: Number of checkpoints created across all sessions
- **Rewind Rate**: Percentage of checkpoints that were used for rewinds
- **Checkpoint Frequency**: Average checkpoints per session
- **Most Used Checkpoints**: Identify frequently reverted-to checkpoints
- **Efficiency Score**: Measure of checkpoint effectiveness

#### Subagent Performance
- **Subagent Count**: Number of subagents used in parallel development
- **Efficiency Score**: Performance rating for each subagent type
- **Task Completion Rate**: Percentage of assigned tasks completed
- **Parallel Development Sessions**: Sessions using multiple subagents
- **Agent Specialization**: Breakdown by subagent type (frontend, backend, testing, etc.)

#### Background Task Metrics
- **Task Duration**: Average time for background tasks to complete
- **Completion Rate**: Percentage of tasks that complete successfully
- **Resource Efficiency**: Token usage per task type
- **Long-Running Tasks**: Identification of tasks running for extended periods
- **Task Type Distribution**: Breakdown by task category

#### VS Code Integration Analytics
- **Extension Usage**: Frequency of VS Code extension interactions
- **File Operations**: Number of file modifications and operations
- **Diff Views**: Usage of inline diff viewing
- **Sidebar Interactions**: Navigation and panel usage patterns
- **Integration Efficiency**: Measure of VS Code integration effectiveness

#### Autonomy & Session Classification
- **Autonomy Level**: Average AI autonomy across sessions (0-10 scale)
- **Session Type Distribution**: Breakdown of standard, extended, and autonomous sessions
- **Extended Session Duration**: Analysis of 30+ hour sessions
- **Autonomous Development Patterns**: Identification of high-autonomy development sessions

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 13+
- Claude Code 2.0 CLI installed
- VS Code with Claude Code extension (optional)

### Installation Steps

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd claude-code-analytics
   npm install
   ```

2. **Database Setup**
   ```bash
   # Create database
   createdb claude_code_analytics
   
   # Run enhanced schema for Claude Code 2.0
   psql claude_code_analytics -f schema-claude-code-2.sql
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Configure database connection
   DATABASE_URL=postgresql://username:password@localhost:5432/claude_code_analytics
   PORT=3001
   ```

4. **Start Services**
   ```bash
   # Development mode
   npm run dev:all
   
   # Production mode
   npm run build:all
   npm start
   ```

### Docker Setup (Recommended)

1. **Docker Compose Setup**
   ```bash
   # Start all services
   docker-compose up --build
   
   # With Claude Code 2.0 data volume
   docker-compose -f docker-compose.claude-code-2.yml up --build
   ```

2. **Data Volume Configuration**
   ```yaml
   # docker-compose.claude-code-2.yml
   version: '3.8'
   services:
     backend:
       volumes:
         - ~/.claude/projects:/app/data/claude-projects:ro
     frontend:
       volumes:
         - ~/.claude/projects:/app/data/claude-projects:ro
   ```

## 📈 Usage Guide

### Dashboard Navigation

#### Main Dashboard
- **Overview Metrics**: Total sessions, costs, tokens with Claude Code 2.0 enhancements
- **Session Type Distribution**: Visual breakdown of standard, extended, and autonomous sessions
- **Feature Usage**: Quick stats on checkpoints, subagents, background tasks, and VS Code integration
- **Autonomy Trends**: Timeline showing autonomy level changes over time

#### Session Analysis
- **Session List**: Filterable list with Claude Code 2.0 features
  - Filter by session type (standard, extended, autonomous)
  - Filter by autonomy level (0-10 scale)
  - Filter by Claude Code 2.0 features (checkpoints, subagents, background tasks, VS Code integration)
- **Session Details**: Comprehensive view of individual sessions
  - Checkpoint timeline with rewind tracking
  - Subagent performance metrics
  - Background task progress and completion
  - VS Code integration activity

#### Advanced Analytics
- **Checkpoint Analytics**: Detailed analysis of checkpoint usage and efficiency
- **Subagent Performance**: Parallel development metrics and agent efficiency
- **Background Task Analysis**: Long-running process monitoring and optimization
- **VS Code Integration**: IDE usage patterns and integration effectiveness

### Filtering & Search

#### Date Range Filtering
- **Preset Ranges**: 7d, 14d, 30d, 90d, all time
- **Custom Ranges**: Select specific start and end dates
- **Extended Session Focus**: Filter specifically for 30+ hour sessions

#### Feature-Based Filtering
- **Session Type**: Standard, Extended, Autonomous
- **Claude Code 2.0 Features**: Checkpoints, Subagents, Background Tasks, VS Code Integration
- **Autonomy Level**: Minimum autonomy threshold (0-10)
- **Session Duration**: Filter by session length

#### Advanced Filters
- **Project-Based**: Filter by specific projects
- **Model-Based**: Filter by Claude model version
- **Cost-Based**: Filter by cost ranges
- **Efficiency-Based**: Filter by efficiency metrics

## 🔧 Configuration

### Claude Code 2.0 Specific Settings

#### Extended Session Configuration
```javascript
// config/claude-code-2.js
module.exports = {
  extendedSessionThreshold: 108000, // 30 hours in seconds
  autonomyLevelThreshold: 7, // High autonomy threshold
  checkpointRetentionDays: 90,
  backgroundTaskTimeout: 3600, // 1 hour timeout
  subagentMaxConcurrent: 5,
  vscodeIntegrationEnabled: true
};
```

#### Database Optimization
```sql
-- Optimized indexes for Claude Code 2.0 features
CREATE INDEX CONCURRENTLY idx_sessions_extended ON sessions(is_extended_session);
CREATE INDEX CONCURRENTLY idx_sessions_autonomy ON sessions(autonomy_level);
CREATE INDEX CONCURRENTLY idx_checkpoints_rewind ON checkpoints(is_rewind_point);
CREATE INDEX CONCURRENTLY idx_subagents_efficiency ON subagents(efficiency_score);
```

### Performance Tuning

#### Memory Optimization
- **Extended Session Handling**: Optimized for 30+ hour sessions
- **Batch Processing**: Efficient processing of large datasets
- **Caching Strategy**: Smart caching for frequently accessed data
- **Memory Management**: Automatic cleanup of old data

#### Database Optimization
- **Query Optimization**: Optimized queries for Claude Code 2.0 features
- **Index Strategy**: Strategic indexing for performance
- **Connection Pooling**: Efficient database connection management
- **Data Partitioning**: Partitioning for large datasets

## 🚨 Troubleshooting

### Common Issues

#### Extended Session Performance
**Problem**: Slow loading of extended sessions (30+ hours)
**Solution**: 
- Enable memory optimization in config
- Use pagination for large sessions
- Implement lazy loading for session details

#### Checkpoint Data Missing
**Problem**: Checkpoints not appearing in analytics
**Solution**:
- Verify Claude Code 2.0 is properly installed
- Check JSONL file format for checkpoint data
- Ensure proper data sync configuration

#### Subagent Tracking Issues
**Problem**: Subagent metrics not accurate
**Solution**:
- Verify subagent data in JSONL files
- Check subagent ID consistency
- Ensure proper message parsing

#### VS Code Integration Not Detected
**Problem**: VS Code integration not showing in analytics
**Solution**:
- Verify VS Code extension is installed
- Check integration data in JSONL files
- Ensure proper extension configuration

### Performance Issues

#### Large Dataset Handling
**Problem**: Dashboard slow with large datasets
**Solution**:
- Implement data pagination
- Use database query optimization
- Enable caching for frequently accessed data
- Consider data archiving for old sessions

#### Memory Usage
**Problem**: High memory usage with extended sessions
**Solution**:
- Optimize data processing algorithms
- Implement memory-efficient data structures
- Use streaming for large datasets
- Enable garbage collection optimization

### Data Quality Issues

#### Missing Claude Code 2.0 Data
**Problem**: Some Claude Code 2.0 features not tracked
**Solution**:
- Verify JSONL file format compatibility
- Check data parsing configuration
- Ensure proper field mapping
- Validate data integrity

#### Inconsistent Metrics
**Problem**: Metrics don't match expected values
**Solution**:
- Verify data calculation algorithms
- Check for data duplication
- Validate metric aggregation logic
- Ensure proper data synchronization

## 📚 API Reference

### Enhanced Endpoints

#### Analytics Endpoints
```http
GET /api/analytics/overview
# Returns enhanced overview with Claude Code 2.0 metrics

GET /api/analytics/checkpoints
# Returns checkpoint analytics and rewind tracking

GET /api/analytics/subagents
# Returns subagent performance metrics

GET /api/analytics/background-tasks
# Returns background task analytics

GET /api/analytics/vscode-integrations
# Returns VS Code integration metrics
```

#### Session Endpoints
```http
GET /api/analytics/sessions?sessionType=extended
# Filter sessions by type (standard, extended, autonomous)

GET /api/analytics/sessions?minAutonomyLevel=7
# Filter sessions by minimum autonomy level

GET /api/analytics/sessions?hasCheckpoints=true
# Filter sessions with checkpoints

GET /api/analytics/sessions/{id}/checkpoints
# Get checkpoints for specific session

GET /api/analytics/sessions/{id}/subagents
# Get subagents for specific session

GET /api/analytics/sessions/{id}/background-tasks
# Get background tasks for specific session
```

### Query Parameters

#### Session Filtering
- `sessionType`: standard | extended | autonomous
- `minAutonomyLevel`: 0-10 autonomy threshold
- `hasCheckpoints`: true | false
- `hasSubagents`: true | false
- `hasBackgroundTasks`: true | false
- `hasVSCodeIntegration`: true | false

#### Date Filtering
- `dateRange`: 7d | 14d | 30d | 90d | all
- `startDate`: ISO date string
- `endDate`: ISO date string

## 🔄 Migration Guide

### From Claude Code 1.0 to 2.0

#### Data Migration
1. **Backup Existing Data**
   ```bash
   pg_dump claude_code_analytics > backup.sql
   ```

2. **Update Schema**
   ```bash
   psql claude_code_analytics -f schema-claude-code-2.sql
   ```

3. **Re-sync Data**
   ```bash
   npm run sync:claude-code-2
   ```

#### Configuration Updates
1. **Update Environment Variables**
   ```bash
   # Add Claude Code 2.0 specific settings
   CLAUDE_CODE_2_ENABLED=true
   EXTENDED_SESSION_THRESHOLD=108000
   AUTONOMY_LEVEL_THRESHOLD=7
   ```

2. **Update Docker Configuration**
   ```yaml
   # Add Claude Code 2.0 volume mounts
   volumes:
     - ~/.claude/projects:/app/data/claude-projects:ro
   ```

## 🎯 Best Practices

### Data Management
- **Regular Sync**: Set up automated data synchronization
- **Data Retention**: Configure appropriate retention policies
- **Backup Strategy**: Implement regular data backups
- **Monitoring**: Set up monitoring for data quality

### Performance Optimization
- **Indexing**: Maintain proper database indexes
- **Caching**: Use appropriate caching strategies
- **Pagination**: Implement pagination for large datasets
- **Memory Management**: Monitor and optimize memory usage

### Security
- **Data Privacy**: Ensure local data remains private
- **Access Control**: Implement proper access controls
- **Encryption**: Use encryption for sensitive data
- **Audit Logging**: Maintain audit logs for data access

## 📞 Support

### Getting Help
- **Documentation**: Check this guide and API documentation
- **Issues**: Report issues on GitHub
- **Community**: Join the discussion forum
- **Updates**: Follow for latest updates and features

### Contributing
- **Code Contributions**: Submit pull requests for improvements
- **Documentation**: Help improve documentation
- **Testing**: Contribute test cases and scenarios
- **Feedback**: Provide feedback on features and usability

---

*This guide covers Claude Code Analytics 2.0 with full support for Claude Code 2.0's advanced features. For additional help or questions, please refer to the troubleshooting section or contact support.*
