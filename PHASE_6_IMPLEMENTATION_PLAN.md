# Phase 6 - Claude Code 2.0 Complete Implementation Plan

## Executive Summary

**Goal**: Complete the Claude Code 2.0 feature implementation from 30% to 100%
**Timeline**: 8-12 weeks (150-200 hours)
**Approach**: Bottom-up implementation (Database → API → Frontend)
**Status**: Planning Phase

---

## Current State vs Target State

### What We Have ✅
- ✅ Database schema fully designed (4 new tables, 13 new fields)
- ✅ TypeScript types complete (all interfaces defined)
- ✅ Parser extracting all Claude Code 2.0 data correctly
- ✅ Feature flags stored in sessions table
- ✅ Test files created (structure exists)

### What We Need ❌
- ❌ Database inserter writing to feature tables
- ❌ Query builder methods for Claude Code 2.0 data
- ❌ API endpoints exposing the data
- ❌ Frontend components visualizing the data
- ❌ Integration between all layers
- ❌ Working tests with real data

---

## Implementation Phases (Bottom-Up Approach)

### Phase 6.1: Database Layer Enhancement (Week 1-2)
**Effort**: 30 hours | **Priority**: CRITICAL | **Blocker**: None

#### Objectives
1. Complete database insertion for all Claude Code 2.0 features
2. Ensure data integrity and relationships
3. Add proper error handling for malformed data
4. Create helper methods for batch operations

#### Tasks

##### Task 6.1.1: Install Dependencies & Fix Build
**File**: Root and frontend package.json
**Effort**: 2 hours
```bash
# Backend
npm install

# Frontend
cd frontend && npm install

# Verify builds
npm run build
cd frontend && npm run build
```

**Acceptance Criteria**:
- ✅ All dependencies installed
- ✅ `npm run build` succeeds with 0 errors
- ✅ `cd frontend && npm run build` succeeds

##### Task 6.1.2: Enhance Raw Messages Table
**File**: `src/database/inserter.ts:247-260`
**Effort**: 4 hours

Add 6 new fields to raw_messages insertion:
```typescript
// Current (11 fields)
INSERT INTO raw_messages (
  session_id, message_index, role, content, content_length,
  input_tokens, output_tokens, tool_name, tool_input, tool_output,
  timestamp, processing_time_ms
)

// Enhanced (17 fields) - ADD THESE:
INSERT INTO raw_messages (
  ...existing fields...,
  checkpoint_id,              // NEW
  subagent_id,               // NEW
  background_task_id,        // NEW
  vscode_integration_id,     // NEW
  is_rewind_trigger,         // NEW
  autonomy_level            // NEW
)
```

**Implementation Pattern**:
```typescript
// src/database/inserter.ts - Add to insertMessages method
private async insertMessages(
  sessionId: string,
  messages: DatabaseMessageEnhanced[], // Already enhanced!
  client: PoolClient
): Promise<void> {
  const query = `
    INSERT INTO raw_messages (
      session_id, message_index, role, content, content_length,
      input_tokens, output_tokens, tool_name, tool_input, tool_output,
      timestamp, processing_time_ms,
      checkpoint_id, subagent_id, background_task_id,
      vscode_integration_id, is_rewind_trigger, autonomy_level
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
  `;

  for (const msg of messages) {
    await client.query(query, [
      sessionId,
      msg.message_index,
      msg.role,
      msg.content,
      msg.content_length,
      msg.input_tokens,
      msg.output_tokens,
      msg.tool_name,
      msg.tool_input,
      msg.tool_output,
      msg.timestamp,
      msg.processing_time_ms,
      // NEW Claude Code 2.0 fields
      msg.checkpoint_id || null,
      msg.subagent_id || null,
      msg.background_task_id || null,
      msg.vscode_integration_id || null,
      msg.is_rewind_trigger || false,
      msg.autonomy_level || 0
    ]);
  }
}
```

**Acceptance Criteria**:
- ✅ All 6 new fields inserted to raw_messages
- ✅ Nulls handled properly
- ✅ Data types match schema
- ✅ No errors on sample JSONL files

##### Task 6.1.3: Create Checkpoint Insertion Method
**File**: `src/database/inserter.ts`
**Effort**: 5 hours

```typescript
/**
 * Insert checkpoints from parsed session data
 */
private async insertCheckpoints(
  sessionDbId: string,
  checkpoints: Checkpoint[],
  client: PoolClient
): Promise<void> {
  if (!checkpoints || checkpoints.length === 0) return;

  const query = `
    INSERT INTO checkpoints (
      session_id, checkpoint_id, checkpoint_name, created_at,
      description, file_snapshot, code_changes, tokens_used,
      cost_usd, is_rewind_point, rewind_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (session_id, checkpoint_id)
    DO UPDATE SET
      rewind_count = checkpoints.rewind_count + EXCLUDED.rewind_count,
      updated_at = NOW()
  `;

  for (const checkpoint of checkpoints) {
    await client.query(query, [
      sessionDbId,
      checkpoint.checkpoint_id,
      checkpoint.checkpoint_name || 'Unnamed Checkpoint',
      checkpoint.created_at,
      checkpoint.description,
      checkpoint.file_snapshot ? JSON.stringify(checkpoint.file_snapshot) : null,
      checkpoint.code_changes ? JSON.stringify(checkpoint.code_changes) : null,
      checkpoint.tokens_used || 0,
      checkpoint.cost_usd || 0,
      checkpoint.is_rewind_point || false,
      checkpoint.rewind_count || 0
    ]);
  }
}
```

**Data Source**: Parser already creates this in `ParsedSessionData.checkpoints`

**Acceptance Criteria**:
- ✅ Checkpoints inserted to database
- ✅ Rewind counts accumulated properly
- ✅ JSONB fields stored correctly
- ✅ Duplicate handling works

##### Task 6.1.4: Create Background Task Insertion Method
**File**: `src/database/inserter.ts`
**Effort**: 5 hours

```typescript
/**
 * Insert background tasks from parsed session data
 */
private async insertBackgroundTasks(
  sessionDbId: string,
  backgroundTasks: BackgroundTask[],
  client: PoolClient
): Promise<void> {
  if (!backgroundTasks || backgroundTasks.length === 0) return;

  const query = `
    INSERT INTO background_tasks (
      session_id, task_id, task_name, task_type,
      started_at, completed_at, duration_seconds, status,
      progress_percentage, description, input_tokens, output_tokens,
      cost_usd, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (session_id, task_id)
    DO UPDATE SET
      completed_at = EXCLUDED.completed_at,
      duration_seconds = EXCLUDED.duration_seconds,
      status = EXCLUDED.status,
      progress_percentage = EXCLUDED.progress_percentage
  `;

  for (const task of backgroundTasks) {
    await client.query(query, [
      sessionDbId,
      task.task_id,
      task.task_name || 'Unnamed Task',
      task.task_type || 'unknown',
      task.started_at,
      task.completed_at || null,
      task.duration_seconds || null,
      task.status || 'running',
      task.progress_percentage || 0,
      task.description,
      task.input_tokens || 0,
      task.output_tokens || 0,
      task.cost_usd || 0,
      task.error_message || null
    ]);
  }
}
```

**Acceptance Criteria**:
- ✅ Background tasks stored
- ✅ Progress updates handled
- ✅ Status transitions tracked
- ✅ Error messages captured

##### Task 6.1.5: Create Subagent Insertion Method
**File**: `src/database/inserter.ts`
**Effort**: 5 hours

```typescript
/**
 * Insert subagents from parsed session data
 */
private async insertSubagents(
  sessionDbId: string,
  subagents: Subagent[],
  client: PoolClient
): Promise<void> {
  if (!subagents || subagents.length === 0) return;

  const query = `
    INSERT INTO subagents (
      session_id, subagent_id, subagent_name, subagent_type,
      started_at, completed_at, duration_seconds, status,
      tasks_assigned, tasks_completed, input_tokens, output_tokens,
      cost_usd, efficiency_score
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (session_id, subagent_id)
    DO UPDATE SET
      completed_at = EXCLUDED.completed_at,
      duration_seconds = EXCLUDED.duration_seconds,
      status = EXCLUDED.status,
      tasks_completed = EXCLUDED.tasks_completed,
      efficiency_score = EXCLUDED.efficiency_score
  `;

  for (const subagent of subagents) {
    await client.query(query, [
      sessionDbId,
      subagent.subagent_id,
      subagent.subagent_name || 'Unnamed Subagent',
      subagent.subagent_type || 'general',
      subagent.started_at,
      subagent.completed_at || null,
      subagent.duration_seconds || null,
      subagent.status || 'active',
      subagent.tasks_assigned || [],
      subagent.tasks_completed || [],
      subagent.input_tokens || 0,
      subagent.output_tokens || 0,
      subagent.cost_usd || 0,
      subagent.efficiency_score || null
    ]);
  }
}
```

**Acceptance Criteria**:
- ✅ Subagents stored with all metadata
- ✅ Task arrays handled properly
- ✅ Efficiency calculations preserved
- ✅ Status updates work

##### Task 6.1.6: Create VS Code Integration Insertion Method
**File**: `src/database/inserter.ts`
**Effort**: 5 hours

```typescript
/**
 * Insert VS Code integrations from parsed session data
 */
private async insertVSCodeIntegrations(
  sessionDbId: string,
  vscodeIntegrations: VSCodeIntegration[],
  client: PoolClient
): Promise<void> {
  if (!vscodeIntegrations || vscodeIntegrations.length === 0) return;

  const query = `
    INSERT INTO vscode_integrations (
      session_id, integration_id, integration_type, action_type,
      timestamp, file_path, line_number, changes_made,
      diff_viewed, sidebar_panel, tokens_used, cost_usd
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `;

  for (const integration of vscodeIntegrations) {
    await client.query(query, [
      sessionDbId,
      integration.integration_id,
      integration.integration_type || 'unknown',
      integration.action_type || 'unknown',
      integration.timestamp,
      integration.file_path || null,
      integration.line_number || null,
      integration.changes_made ? JSON.stringify(integration.changes_made) : null,
      integration.diff_viewed || false,
      integration.sidebar_panel || null,
      integration.tokens_used || 0,
      integration.cost_usd || 0
    ]);
  }
}
```

**Acceptance Criteria**:
- ✅ VS Code interactions stored
- ✅ File paths and line numbers captured
- ✅ Diff views tracked
- ✅ JSONB changes stored properly

##### Task 6.1.7: Wire Up All Insertion Methods
**File**: `src/database/inserter.ts:insertSessionData()`
**Effort**: 4 hours

Update the main insertion method to call all new methods:

```typescript
async insertSessionData(parsedData: ParsedSessionData): Promise<void> {
  const client = await this.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert session (existing - already has Claude Code 2.0 flags)
    const sessionDbId = await this.insertSession(parsedData.session, client);

    // 2. Insert session metrics (existing - already has Claude Code 2.0 metrics)
    await this.insertSessionMetrics(sessionDbId, parsedData.session_metrics, client);

    // 3. Insert messages (ENHANCED - now with Claude Code 2.0 fields)
    await this.insertMessages(sessionDbId, parsedData.messages, client);

    // 4. Insert checkpoints (NEW)
    if (parsedData.checkpoints && parsedData.checkpoints.length > 0) {
      await this.insertCheckpoints(sessionDbId, parsedData.checkpoints, client);
    }

    // 5. Insert background tasks (NEW)
    if (parsedData.background_tasks && parsedData.background_tasks.length > 0) {
      await this.insertBackgroundTasks(sessionDbId, parsedData.background_tasks, client);
    }

    // 6. Insert subagents (NEW)
    if (parsedData.subagents && parsedData.subagents.length > 0) {
      await this.insertSubagents(sessionDbId, parsedData.subagents, client);
    }

    // 7. Insert VS Code integrations (NEW)
    if (parsedData.vscode_integrations && parsedData.vscode_integrations.length > 0) {
      await this.insertVSCodeIntegrations(sessionDbId, parsedData.vscode_integrations, client);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

**Acceptance Criteria**:
- ✅ All 7 insertion steps execute in transaction
- ✅ Rollback on any error
- ✅ Proper error logging
- ✅ Data verified in database

---

### Phase 6.2: Query Builder Enhancement (Week 3-4)
**Effort**: 35 hours | **Priority**: CRITICAL | **Blocker**: Phase 6.1

#### Objectives
1. Add query methods for all Claude Code 2.0 features
2. Enhance existing filters with Claude Code 2.0 fields
3. Maintain backward compatibility
4. Optimize query performance with proper indexes

#### Tasks

##### Task 6.2.1: Enhance AnalyticsFilters Interface
**File**: `src/database/query-builder.ts:3-11`
**Effort**: 2 hours

```typescript
export interface AnalyticsFilters {
  // Existing filters
  dateFrom?: Date;
  dateTo?: Date;
  projectName?: string;
  modelName?: string;
  sessionIds?: string[];
  limit?: number;
  offset?: number;

  // NEW: Claude Code 2.0 filters
  sessionType?: 'standard' | 'extended' | 'autonomous' | 'all';
  minAutonomyLevel?: number;  // 0-10
  maxAutonomyLevel?: number;  // 0-10
  hasCheckpoints?: boolean;
  hasSubagents?: boolean;
  hasBackgroundTasks?: boolean;
  hasVSCodeIntegration?: boolean;
  isExtendedSession?: boolean; // 30+ hours
}
```

**Acceptance Criteria**:
- ✅ All new filters typed correctly
- ✅ Backward compatible (all optional)
- ✅ TypeScript compilation succeeds

##### Task 6.2.2: Create getCheckpointAnalytics Method
**File**: `src/database/query-builder.ts`
**Effort**: 5 hours

```typescript
/**
 * Get checkpoint analytics with optional filtering
 */
async getCheckpointAnalytics(filters: AnalyticsFilters = {}): Promise<{
  totalCheckpoints: number;
  totalRewinds: number;
  rewindRate: number;
  avgCheckpointsPerSession: number;
  checkpointsBySession: Array<{
    session_id: string;
    checkpoint_count: number;
    rewind_count: number;
    total_tokens: number;
    total_cost: number;
  }>;
  topCheckpoints: Array<{
    checkpoint_id: string;
    checkpoint_name: string;
    rewind_count: number;
    created_at: Date;
  }>;
}> {
  const whereClause = this.buildWhereClause(filters);

  // Query implementation here
  const result = await this.pool.query(`
    SELECT
      COUNT(DISTINCT c.checkpoint_id) as total_checkpoints,
      SUM(c.rewind_count) as total_rewinds,
      AVG(checkpoint_count.count) as avg_checkpoints_per_session
    FROM checkpoints c
    JOIN sessions s ON c.session_id = s.id
    ${whereClause}
  `);

  // Additional queries for detailed breakdowns
  // ...

  return {
    totalCheckpoints: result.rows[0].total_checkpoints,
    totalRewinds: result.rows[0].total_rewinds,
    rewindRate: /* calculation */,
    avgCheckpointsPerSession: result.rows[0].avg_checkpoints_per_session,
    checkpointsBySession: /* query */,
    topCheckpoints: /* query */
  };
}
```

**Acceptance Criteria**:
- ✅ Returns comprehensive checkpoint stats
- ✅ Filters applied correctly
- ✅ Performance < 500ms for 10k checkpoints
- ✅ Handles empty results gracefully

##### Task 6.2.3: Create getSubagentPerformance Method
**File**: `src/database/query-builder.ts`
**Effort**: 6 hours

```typescript
/**
 * Get subagent performance metrics
 */
async getSubagentPerformance(filters: AnalyticsFilters = {}): Promise<{
  totalSubagents: number;
  avgEfficiencyScore: number;
  subagentsByType: Array<{
    subagent_type: string;
    count: number;
    avg_efficiency: number;
    total_tokens: number;
    total_cost: number;
    avg_duration_seconds: number;
  }>;
  parallelSessionCount: number;
  topPerformingSubagents: Array<{
    subagent_id: string;
    subagent_name: string;
    subagent_type: string;
    efficiency_score: number;
    tasks_completed: number;
  }>;
}> {
  // Implementation with multiple aggregation queries
  // Group by subagent_type
  // Calculate efficiency metrics
  // Identify parallel development sessions
}
```

**Acceptance Criteria**:
- ✅ Accurate efficiency calculations
- ✅ Parallel session detection works
- ✅ Type-based aggregations correct
- ✅ Top performers ranked properly

##### Task 6.2.4: Create getBackgroundTaskMetrics Method
**File**: `src/database/query-builder.ts`
**Effort**: 5 hours

```typescript
/**
 * Get background task monitoring metrics
 */
async getBackgroundTaskMetrics(filters: AnalyticsFilters = {}): Promise<{
  totalTasks: number;
  completionRate: number;
  avgDurationSeconds: number;
  tasksByType: Array<{
    task_type: string;
    count: number;
    completion_rate: number;
    avg_duration: number;
    total_cost: number;
  }>;
  longRunningTasks: Array<{
    task_id: string;
    task_name: string;
    duration_seconds: number;
    status: string;
    progress_percentage: number;
  }>;
  failedTasks: Array<{
    task_id: string;
    task_name: string;
    error_message: string;
    started_at: Date;
  }>;
}> {
  // Implementation
}
```

**Acceptance Criteria**:
- ✅ Completion rates calculated correctly
- ✅ Long-running tasks identified (> threshold)
- ✅ Failed tasks with error details
- ✅ Type-based analysis accurate

##### Task 6.2.5: Create getVSCodeIntegrationStats Method
**File**: `src/database/query-builder.ts`
**Effort**: 5 hours

```typescript
/**
 * Get VS Code integration statistics
 */
async getVSCodeIntegrationStats(filters: AnalyticsFilters = {}): Promise<{
  totalIntegrations: number;
  integrationsByType: Array<{
    integration_type: string;
    count: number;
    total_tokens: number;
  }>;
  diffViewRate: number;
  topFiles: Array<{
    file_path: string;
    modification_count: number;
    last_modified: Date;
  }>;
  sidebarUsage: Array<{
    sidebar_panel: string;
    usage_count: number;
  }>;
}> {
  // Implementation
}
```

**Acceptance Criteria**:
- ✅ Integration types counted
- ✅ Diff view percentage accurate
- ✅ File rankings correct
- ✅ Sidebar analytics complete

##### Task 6.2.6: Create getExtendedSessionAnalytics Method
**File**: `src/database/query-builder.ts`
**Effort**: 6 hours

```typescript
/**
 * Get analytics for extended (30+ hour) sessions
 */
async getExtendedSessionAnalytics(filters: AnalyticsFilters = {}): Promise<{
  extendedSessionCount: number;
  avgDurationHours: number;
  avgAutonomyLevel: number;
  sessionTypeDistribution: Array<{
    session_type: string;
    count: number;
    avg_cost: number;
    avg_tokens: number;
  }>;
  autonomyTrends: Array<{
    date: Date;
    avg_autonomy_level: number;
    session_count: number;
  }>;
  costBySessionType: Array<{
    session_type: string;
    total_cost: number;
    avg_cost_per_session: number;
  }>;
}> {
  // Implementation with focus on extended sessions
}
```

**Acceptance Criteria**:
- ✅ Extended sessions (30+ hours) identified
- ✅ Autonomy trends over time
- ✅ Cost breakdowns by session type
- ✅ Type distribution accurate

##### Task 6.2.7: Enhance Existing Methods with Claude Code 2.0 Filters
**File**: `src/database/query-builder.ts`
**Effort**: 6 hours

Update these existing methods to support new filters:
- `getSessions()` - add session type, autonomy level filtering
- `getSessionById()` - include Claude Code 2.0 metrics
- `getDailyUsage()` - segment by session type
- `getOverview()` - add Claude Code 2.0 summary stats

```typescript
// Example: Enhanced getSessions
async getSessions(filters: AnalyticsFilters = {}) {
  let whereConditions: string[] = ['1=1'];
  const params: any[] = [];

  // Existing conditions
  if (filters.dateFrom) { /* ... */ }
  if (filters.dateTo) { /* ... */ }

  // NEW: Claude Code 2.0 conditions
  if (filters.sessionType && filters.sessionType !== 'all') {
    params.push(filters.sessionType);
    whereConditions.push(`s.session_type = $${params.length}`);
  }

  if (filters.minAutonomyLevel !== undefined) {
    params.push(filters.minAutonomyLevel);
    whereConditions.push(`s.autonomy_level >= $${params.length}`);
  }

  if (filters.hasCheckpoints) {
    whereConditions.push(`EXISTS (SELECT 1 FROM checkpoints c WHERE c.session_id = s.id)`);
  }

  // ... more filter conditions
}
```

**Acceptance Criteria**:
- ✅ All existing methods enhanced
- ✅ Backward compatible (filters optional)
- ✅ No performance regression
- ✅ Query plans optimized

---

### Phase 6.3: API Endpoints (Week 4-5)
**Effort**: 35 hours | **Priority**: HIGH | **Blocker**: Phase 6.2

#### Objectives
1. Create REST endpoints for all Claude Code 2.0 analytics
2. Add filtering support to existing endpoints
3. Implement proper error handling and validation
4. Add request/response documentation

#### Tasks

##### Task 6.3.1: Create Checkpoint Analytics Endpoint
**File**: `src/server/routes/analytics.ts`
**Effort**: 5 hours

```typescript
// GET /api/analytics/checkpoints
fastify.get('/checkpoints', async (request, reply) => {
  try {
    const filters = parseFilters(request.query);
    const analytics = await queryBuilder.getCheckpointAnalytics(filters);

    return reply.send({
      success: true,
      data: analytics,
      meta: {
        filters: filters,
        timestamp: new Date()
      }
    });
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch checkpoint analytics'
    });
  }
});

// GET /api/analytics/sessions/:sessionId/checkpoints
fastify.get('/sessions/:sessionId/checkpoints', async (request, reply) => {
  const { sessionId } = request.params;

  const checkpoints = await queryBuilder.getSessionCheckpoints(sessionId);

  return reply.send({
    success: true,
    data: checkpoints
  });
});
```

**Acceptance Criteria**:
- ✅ Endpoint returns checkpoint analytics
- ✅ Filtering works correctly
- ✅ Error handling comprehensive
- ✅ Response format consistent

##### Task 6.3.2: Create Subagent Performance Endpoint
**File**: `src/server/routes/analytics.ts`
**Effort**: 5 hours

```typescript
// GET /api/analytics/subagents
fastify.get('/subagents', async (request, reply) => {
  const filters = parseFilters(request.query);
  const performance = await queryBuilder.getSubagentPerformance(filters);

  return reply.send({
    success: true,
    data: performance
  });
});

// GET /api/analytics/sessions/:sessionId/subagents
fastify.get('/sessions/:sessionId/subagents', async (request, reply) => {
  const { sessionId } = request.params;
  const subagents = await queryBuilder.getSessionSubagents(sessionId);

  return reply.send({
    success: true,
    data: subagents
  });
});
```

##### Task 6.3.3: Create Background Task Endpoint
**File**: `src/server/routes/analytics.ts`
**Effort**: 5 hours

```typescript
// GET /api/analytics/background-tasks
fastify.get('/background-tasks', async (request, reply) => {
  const filters = parseFilters(request.query);
  const metrics = await queryBuilder.getBackgroundTaskMetrics(filters);

  return reply.send({
    success: true,
    data: metrics
  });
});
```

##### Task 6.3.4: Create VS Code Integration Endpoint
**File**: `src/server/routes/analytics.ts`
**Effort**: 4 hours

```typescript
// GET /api/analytics/vscode-integrations
fastify.get('/vscode-integrations', async (request, reply) => {
  const filters = parseFilters(request.query);
  const stats = await queryBuilder.getVSCodeIntegrationStats(filters);

  return reply.send({
    success: true,
    data: stats
  });
});
```

##### Task 6.3.5: Create Extended Session Analytics Endpoint
**File**: `src/server/routes/analytics.ts`
**Effort**: 4 hours

```typescript
// GET /api/analytics/extended-sessions
fastify.get('/extended-sessions', async (request, reply) => {
  const filters = parseFilters(request.query);
  const analytics = await queryBuilder.getExtendedSessionAnalytics(filters);

  return reply.send({
    success: true,
    data: analytics
  });
});
```

##### Task 6.3.6: Enhance Existing Endpoints with Filters
**File**: `src/server/routes/analytics.ts`
**Effort**: 6 hours

Update existing endpoints to accept Claude Code 2.0 filters:

```typescript
// GET /api/analytics/sessions - Enhanced
fastify.get('/sessions', async (request, reply) => {
  const filters = parseFilters(request.query); // Now includes Claude Code 2.0 filters
  const sessions = await queryBuilder.getSessions(filters);

  return reply.send({
    success: true,
    data: sessions,
    meta: {
      filters: filters,
      total: sessions.length
    }
  });
});

// Filter parser helper
function parseFilters(query: any): AnalyticsFilters {
  return {
    // Existing filters
    dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
    dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    projectName: query.projectName,
    modelName: query.modelName,

    // NEW: Claude Code 2.0 filters
    sessionType: query.sessionType,
    minAutonomyLevel: query.minAutonomyLevel ? parseInt(query.minAutonomyLevel) : undefined,
    maxAutonomyLevel: query.maxAutonomyLevel ? parseInt(query.maxAutonomyLevel) : undefined,
    hasCheckpoints: query.hasCheckpoints === 'true',
    hasSubagents: query.hasSubagents === 'true',
    hasBackgroundTasks: query.hasBackgroundTasks === 'true',
    hasVSCodeIntegration: query.hasVSCodeIntegration === 'true',
    isExtendedSession: query.isExtendedSession === 'true',
    limit: query.limit ? parseInt(query.limit) : 100,
    offset: query.offset ? parseInt(query.offset) : 0
  };
}
```

##### Task 6.3.7: Add Input Validation
**File**: `src/server/routes/analytics.ts`
**Effort**: 4 hours

```typescript
// Use Fastify schema validation
const checkpointQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      dateFrom: { type: 'string', format: 'date-time' },
      dateTo: { type: 'string', format: 'date-time' },
      sessionType: { type: 'string', enum: ['standard', 'extended', 'autonomous', 'all'] },
      minAutonomyLevel: { type: 'integer', minimum: 0, maximum: 10 },
      maxAutonomyLevel: { type: 'integer', minimum: 0, maximum: 10 }
    }
  }
};

fastify.get('/checkpoints', { schema: checkpointQuerySchema }, async (request, reply) => {
  // Implementation
});
```

**Acceptance Criteria**:
- ✅ All 5 new endpoints created
- ✅ Existing endpoints enhanced
- ✅ Input validation active
- ✅ Error responses consistent
- ✅ API documented with examples

---

### Phase 6.4: Frontend Components (Week 6-8)
**Effort**: 60 hours | **Priority**: HIGH | **Blocker**: Phase 6.3

#### Objectives
1. Create visualization components for all Claude Code 2.0 features
2. Add filtering UI to existing pages
3. Create new dedicated pages for Claude Code 2.0 analytics
4. Ensure responsive design and accessibility

#### Component Architecture

```
frontend/src/components/
├── claude-code-2/               # NEW directory
│   ├── CheckpointTimeline.tsx   # Checkpoint visualization
│   ├── SubagentPerformance.tsx  # Subagent metrics
│   ├── BackgroundTaskMonitor.tsx # Task status
│   ├── VSCodeIntegration.tsx    # IDE usage
│   ├── AutonomyLevelChart.tsx   # Autonomy trends
│   └── index.ts                 # Exports
├── filters/                     # ENHANCED
│   ├── SessionTypeFilter.tsx    # NEW
│   ├── AutonomyLevelFilter.tsx  # NEW
│   └── FeatureFilter.tsx        # NEW
└── analytics/                   # EXISTING
    └── StatsCard.tsx            # Enhanced with Claude Code 2.0 stats

frontend/src/routes/
├── claude-code-2.tsx            # NEW: Main Claude Code 2.0 dashboard
├── checkpoints.tsx              # NEW: Checkpoint analytics page
├── index.tsx                    # ENHANCED: Add Claude Code 2.0 overview
└── sessions.tsx                 # ENHANCED: Add filtering UI
```

#### Tasks

##### Task 6.4.1: Create CheckpointTimeline Component
**File**: `frontend/src/components/claude-code-2/CheckpointTimeline.tsx`
**Effort**: 8 hours

```typescript
import { useQuery } from '@tanstack/react-query';
import { LineChart, XAxis, YAxis, Tooltip, Line, ReferenceLine } from 'recharts';
import { api } from '@/lib/api';

interface CheckpointTimelineProps {
  sessionId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function CheckpointTimeline({ sessionId, dateFrom, dateTo }: CheckpointTimelineProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['checkpoints', sessionId, dateFrom, dateTo],
    queryFn: () => api.getCheckpointAnalytics({ sessionId, dateFrom, dateTo })
  });

  if (isLoading) return <div>Loading checkpoints...</div>;
  if (error) return <div>Error loading checkpoints</div>;

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Checkpoint Timeline</h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Checkpoints"
          value={data.totalCheckpoints}
          icon={<CheckpointIcon />}
        />
        <StatsCard
          title="Total Rewinds"
          value={data.totalRewinds}
          icon={<RewindIcon />}
        />
        <StatsCard
          title="Rewind Rate"
          value={`${(data.rewindRate * 100).toFixed(1)}%`}
          icon={<PercentageIcon />}
        />
      </div>

      {/* Timeline Chart */}
      <LineChart width={800} height={400} data={data.checkpointsBySession}>
        <XAxis dataKey="created_at" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="checkpoint_count"
          stroke="#FF6B35"
          name="Checkpoints Created"
        />
        <Line
          type="monotone"
          dataKey="rewind_count"
          stroke="#4ECDC4"
          name="Rewinds Used"
        />
      </LineChart>

      {/* Top Checkpoints Table */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold mb-3">Most Used Checkpoints</h4>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-2">Checkpoint Name</th>
              <th className="pb-2">Rewind Count</th>
              <th className="pb-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.topCheckpoints.map(cp => (
              <tr key={cp.checkpoint_id} className="border-b border-gray-700">
                <td className="py-2">{cp.checkpoint_name}</td>
                <td className="py-2">{cp.rewind_count}</td>
                <td className="py-2">{new Date(cp.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ Timeline shows checkpoint creation over time
- ✅ Rewind points highlighted
- ✅ Stats cards display key metrics
- ✅ Table shows most-used checkpoints
- ✅ Responsive on mobile

##### Task 6.4.2: Create SubagentPerformance Component
**File**: `frontend/src/components/claude-code-2/SubagentPerformance.tsx`
**Effort**: 8 hours

```typescript
import { PieChart, BarChart } from '@/components/charts';

export function SubagentPerformance({ filters }: { filters: AnalyticsFilters }) {
  const { data, isLoading } = useQuery({
    queryKey: ['subagents', filters],
    queryFn: () => api.getSubagentPerformance(filters)
  });

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard title="Total Subagents" value={data.totalSubagents} />
        <StatsCard title="Avg Efficiency" value={`${data.avgEfficiencyScore.toFixed(1)}%`} />
        <StatsCard title="Parallel Sessions" value={data.parallelSessionCount} />
        <StatsCard title="Tasks Completed" value={data.totalTasksCompleted} />
      </div>

      {/* Subagent Type Distribution */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Subagent Type Distribution</h3>
        <PieChart
          data={data.subagentsByType.map(st => ({
            name: st.subagent_type,
            value: st.count
          }))}
        />
      </div>

      {/* Efficiency by Type */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Efficiency by Subagent Type</h3>
        <BarChart
          data={data.subagentsByType}
          xKey="subagent_type"
          yKey="avg_efficiency"
          title="Average Efficiency Score"
        />
      </div>

      {/* Top Performers */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Top Performing Subagents</h3>
        <div className="space-y-2">
          {data.topPerformingSubagents.map(subagent => (
            <div key={subagent.subagent_id} className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <div>
                <div className="font-semibold">{subagent.subagent_name}</div>
                <div className="text-sm text-gray-400">{subagent.subagent_type}</div>
              </div>
              <div className="text-right">
                <div className="text-orange-500 font-bold">{subagent.efficiency_score}%</div>
                <div className="text-sm text-gray-400">{subagent.tasks_completed} tasks</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ Pie chart shows type distribution
- ✅ Bar chart shows efficiency by type
- ✅ Top performers ranked correctly
- ✅ Parallel development highlighted
- ✅ Mobile responsive

##### Task 6.4.3: Create BackgroundTaskMonitor Component
**File**: `frontend/src/components/claude-code-2/BackgroundTaskMonitor.tsx`
**Effort**: 8 hours

```typescript
export function BackgroundTaskMonitor({ filters }: { filters: AnalyticsFilters }) {
  const { data } = useQuery({
    queryKey: ['background-tasks', filters],
    queryFn: () => api.getBackgroundTaskMetrics(filters)
  });

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard title="Total Tasks" value={data.totalTasks} />
        <StatsCard
          title="Completion Rate"
          value={`${(data.completionRate * 100).toFixed(1)}%`}
          trend={data.completionRate > 0.9 ? 'up' : 'down'}
        />
        <StatsCard title="Avg Duration" value={`${(data.avgDurationSeconds / 60).toFixed(0)} min`} />
        <StatsCard title="Failed Tasks" value={data.failedTasks.length} />
      </div>

      {/* Task Type Breakdown */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Tasks by Type</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th>Task Type</th>
              <th>Count</th>
              <th>Completion Rate</th>
              <th>Avg Duration</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.tasksByType.map(type => (
              <tr key={type.task_type} className="border-b border-gray-700">
                <td className="py-2 capitalize">{type.task_type}</td>
                <td>{type.count}</td>
                <td>{(type.completion_rate * 100).toFixed(1)}%</td>
                <td>{(type.avg_duration / 60).toFixed(0)} min</td>
                <td>${type.total_cost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Long Running Tasks */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Long Running Tasks</h3>
        {data.longRunningTasks.map(task => (
          <div key={task.task_id} className="mb-4 p-4 bg-gray-700 rounded">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold">{task.task_name}</div>
                <div className="text-sm text-gray-400">
                  Duration: {(task.duration_seconds / 3600).toFixed(1)} hours
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                task.status === 'completed' ? 'bg-green-600' :
                task.status === 'running' ? 'bg-blue-600' :
                'bg-red-600'
              }`}>
                {task.status}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${task.progress_percentage}%` }}
              />
            </div>
            <div className="text-right text-sm text-gray-400 mt-1">
              {task.progress_percentage}% complete
            </div>
          </div>
        ))}
      </div>

      {/* Failed Tasks */}
      {data.failedTasks.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-red-400">Failed Tasks</h3>
          {data.failedTasks.map(task => (
            <div key={task.task_id} className="mb-3 p-3 bg-red-900/20 border border-red-500 rounded">
              <div className="font-semibold">{task.task_name}</div>
              <div className="text-sm text-red-300 mt-1">{task.error_message}</div>
              <div className="text-xs text-gray-400 mt-1">
                Started: {new Date(task.started_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ Shows task breakdown by type
- ✅ Progress bars for running tasks
- ✅ Failed tasks highlighted
- ✅ Completion rates accurate
- ✅ Real-time updates (if polling enabled)

##### Task 6.4.4: Create VSCodeIntegration Component
**File**: `frontend/src/components/claude-code-2/VSCodeIntegration.tsx`
**Effort**: 6 hours

```typescript
export function VSCodeIntegration({ filters }: { filters: AnalyticsFilters }) {
  const { data } = useQuery({
    queryKey: ['vscode-integrations', filters],
    queryFn: () => api.getVSCodeIntegrationStats(filters)
  });

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="Total Interactions" value={data.totalIntegrations} />
        <StatsCard title="Diff View Rate" value={`${(data.diffViewRate * 100).toFixed(1)}%`} />
        <StatsCard title="Files Modified" value={data.topFiles.length} />
      </div>

      {/* Integration Types */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Integration Types</h3>
        <BarChart
          data={data.integrationsByType}
          xKey="integration_type"
          yKey="count"
        />
      </div>

      {/* Top Modified Files */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Most Modified Files</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th>File Path</th>
              <th>Modifications</th>
              <th>Last Modified</th>
            </tr>
          </thead>
          <tbody>
            {data.topFiles.map(file => (
              <tr key={file.file_path} className="border-b border-gray-700">
                <td className="py-2 font-mono text-sm">{file.file_path}</td>
                <td>{file.modification_count}</td>
                <td>{new Date(file.last_modified).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sidebar Usage */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Sidebar Panel Usage</h3>
        <PieChart
          data={data.sidebarUsage.map(panel => ({
            name: panel.sidebar_panel,
            value: panel.usage_count
          }))}
        />
      </div>
    </div>
  );
}
```

##### Task 6.4.5: Create AutonomyLevelChart Component
**File**: `frontend/src/components/claude-code-2/AutonomyLevelChart.tsx`
**Effort**: 6 hours

```typescript
export function AutonomyLevelChart({ filters }: { filters: AnalyticsFilters }) {
  const { data } = useQuery({
    queryKey: ['extended-sessions', filters],
    queryFn: () => api.getExtendedSessionAnalytics(filters)
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          title="Avg Autonomy Level"
          value={data.avgAutonomyLevel.toFixed(1)}
          subtitle="out of 10"
        />
        <StatsCard
          title="Extended Sessions"
          value={data.extendedSessionCount}
          subtitle="30+ hours"
        />
        <StatsCard
          title="Avg Duration"
          value={`${data.avgDurationHours.toFixed(1)}h`}
        />
      </div>

      {/* Autonomy Trends Over Time */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Autonomy Level Trends</h3>
        <LineChart
          data={data.autonomyTrends}
          lines={[
            { dataKey: 'avg_autonomy_level', stroke: '#FF6B35', name: 'Avg Autonomy' },
            { dataKey: 'session_count', stroke: '#4ECDC4', name: 'Sessions' }
          ]}
        />
      </div>

      {/* Session Type Distribution */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Session Types</h3>
        <div className="grid grid-cols-3 gap-4">
          {data.sessionTypeDistribution.map(type => (
            <div key={type.session_type} className="p-4 bg-gray-700 rounded">
              <div className="text-2xl font-bold text-orange-500">{type.count}</div>
              <div className="text-gray-400 capitalize">{type.session_type}</div>
              <div className="text-sm text-gray-500 mt-2">
                Avg cost: ${type.avg_cost.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost by Session Type */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Cost Analysis by Session Type</h3>
        <BarChart
          data={data.costBySessionType}
          xKey="session_type"
          yKey="avg_cost_per_session"
          title="Average Cost per Session"
        />
      </div>
    </div>
  );
}
```

##### Task 6.4.6: Create Filter Components
**File**: `frontend/src/components/filters/*.tsx`
**Effort**: 8 hours

```typescript
// SessionTypeFilter.tsx
export function SessionTypeFilter({ value, onChange }: FilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 bg-gray-700 rounded"
    >
      <option value="all">All Session Types</option>
      <option value="standard">Standard</option>
      <option value="extended">Extended (30+ hours)</option>
      <option value="autonomous">Autonomous</option>
    </select>
  );
}

// AutonomyLevelFilter.tsx
export function AutonomyLevelFilter({ min, max, onChange }: RangeFilterProps) {
  return (
    <div className="flex items-center gap-4">
      <label>Autonomy Level:</label>
      <input
        type="range"
        min="0"
        max="10"
        value={min}
        onChange={(e) => onChange({ min: parseInt(e.target.value), max })}
        className="w-32"
      />
      <span>{min} - {max}</span>
    </div>
  );
}

// FeatureFilter.tsx
export function FeatureFilter({ features, onChange }: FeatureFilterProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      <Checkbox
        label="Has Checkpoints"
        checked={features.hasCheckpoints}
        onChange={(checked) => onChange({ ...features, hasCheckpoints: checked })}
      />
      <Checkbox
        label="Has Subagents"
        checked={features.hasSubagents}
        onChange={(checked) => onChange({ ...features, hasSubagents: checked })}
      />
      <Checkbox
        label="Has Background Tasks"
        checked={features.hasBackgroundTasks}
        onChange={(checked) => onChange({ ...features, hasBackgroundTasks: checked })}
      />
      <Checkbox
        label="VS Code Integration"
        checked={features.hasVSCodeIntegration}
        onChange={(checked) => onChange({ ...features, hasVSCodeIntegration: checked })}
      />
    </div>
  );
}
```

##### Task 6.4.7: Create Claude Code 2.0 Dashboard Page
**File**: `frontend/src/routes/claude-code-2.tsx`
**Effort**: 8 hours

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { CheckpointTimeline } from '@/components/claude-code-2/CheckpointTimeline';
import { SubagentPerformance } from '@/components/claude-code-2/SubagentPerformance';
import { BackgroundTaskMonitor } from '@/components/claude-code-2/BackgroundTaskMonitor';
import { VSCodeIntegration } from '@/components/claude-code-2/VSCodeIntegration';
import { AutonomyLevelChart } from '@/components/claude-code-2/AutonomyLevelChart';

export const Route = createFileRoute('/claude-code-2')({
  component: ClaudeCode2Dashboard,
});

function ClaudeCode2Dashboard() {
  const navigate = Route.useNavigate();
  const { dateFrom, dateTo, sessionType } = Route.useSearch();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Claude Code 2.0 Analytics</h1>
        <p className="text-gray-400">
          Track checkpoints, subagents, background tasks, and extended autonomous sessions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-3 gap-4">
          <DateRangePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChange={(range) => navigate({ search: { ...range } })}
          />
          <SessionTypeFilter
            value={sessionType}
            onChange={(type) => navigate({ search: (prev) => ({ ...prev, sessionType: type }) })}
          />
          <AutonomyLevelFilter
            min={0}
            max={10}
            onChange={(range) => navigate({ search: (prev) => ({ ...prev, ...range }) })}
          />
        </div>
      </div>

      {/* Dashboard Sections */}
      <div className="space-y-8">
        {/* Autonomy & Extended Sessions */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Autonomy & Extended Sessions</h2>
          <AutonomyLevelChart filters={{ dateFrom, dateTo, sessionType }} />
        </section>

        {/* Checkpoints */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Checkpoint Analytics</h2>
          <CheckpointTimeline dateFrom={dateFrom} dateTo={dateTo} />
        </section>

        {/* Subagents */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Subagent Performance</h2>
          <SubagentPerformance filters={{ dateFrom, dateTo }} />
        </section>

        {/* Background Tasks */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Background Task Monitoring</h2>
          <BackgroundTaskMonitor filters={{ dateFrom, dateTo }} />
        </section>

        {/* VS Code Integration */}
        <section>
          <h2 className="text-2xl font-bold mb-4">VS Code Integration</h2>
          <VSCodeIntegration filters={{ dateFrom, dateTo }} />
        </section>
      </div>
    </div>
  );
}
```

##### Task 6.4.8: Enhance Main Dashboard with Claude Code 2.0 Overview
**File**: `frontend/src/routes/index.tsx`
**Effort**: 4 hours

Add Claude Code 2.0 quick stats to main dashboard:

```typescript
// Add to existing dashboard
<div className="grid grid-cols-4 gap-4 mb-8">
  {/* Existing stats */}
  <StatsCard title="Total Sessions" value={data.totalSessions} />
  <StatsCard title="Total Cost" value={`$${data.totalCost}`} />

  {/* NEW: Claude Code 2.0 stats */}
  <StatsCard
    title="Extended Sessions"
    value={data.extendedSessionCount}
    subtitle="30+ hours"
    link="/claude-code-2"
  />
  <StatsCard
    title="Avg Autonomy"
    value={data.avgAutonomyLevel.toFixed(1)}
    subtitle="out of 10"
    link="/claude-code-2"
  />
</div>

{/* NEW: Quick Claude Code 2.0 Features Overview */}
<div className="bg-gray-800 p-6 rounded-lg mb-6">
  <h2 className="text-xl font-bold mb-4">Claude Code 2.0 Features</h2>
  <div className="grid grid-cols-4 gap-4">
    <FeatureCard
      icon={<CheckpointIcon />}
      title="Checkpoints"
      value={data.checkpointCount}
      link="/claude-code-2#checkpoints"
    />
    <FeatureCard
      icon={<SubagentIcon />}
      title="Subagents"
      value={data.subagentCount}
      link="/claude-code-2#subagents"
    />
    <FeatureCard
      icon={<TaskIcon />}
      title="Background Tasks"
      value={data.backgroundTaskCount}
      link="/claude-code-2#tasks"
    />
    <FeatureCard
      icon={<VSCodeIcon />}
      title="VS Code Integrations"
      value={data.vscodeIntegrationCount}
      link="/claude-code-2#vscode"
    />
  </div>
</div>
```

##### Task 6.4.9: Enhance Sessions Page with Filters
**File**: `frontend/src/routes/sessions.tsx`
**Effort**: 4 hours

```typescript
// Add filter UI above sessions list
<div className="mb-6 space-y-4">
  <div className="flex gap-4 items-center">
    <DateRangePicker ... />
    <SessionTypeFilter ... />
    <AutonomyLevelFilter ... />
  </div>

  <FeatureFilter
    features={filters}
    onChange={setFilters}
  />
</div>

// Update session list query to use filters
const { data: sessions } = useQuery({
  queryKey: ['sessions', filters],
  queryFn: () => api.getSessions(filters)
});

// Show session badges for Claude Code 2.0 features
<SessionCard session={session}>
  {session.is_extended_session && (
    <Badge color="purple">Extended (30+ hours)</Badge>
  )}
  {session.autonomy_level > 7 && (
    <Badge color="orange">High Autonomy ({session.autonomy_level}/10)</Badge>
  )}
  {session.has_checkpoints && (
    <Badge color="blue">Checkpoints</Badge>
  )}
  {session.has_subagents && (
    <Badge color="green">Subagents</Badge>
  )}
</SessionCard>
```

**Acceptance Criteria**:
- ✅ All filters functional
- ✅ Sessions filtered correctly
- ✅ Badges show Claude Code 2.0 features
- ✅ URL state persists filters
- ✅ Performance optimized

---

### Phase 6.5: Integration & Testing (Week 9-10)
**Effort**: 25 hours | **Priority**: CRITICAL | **Blocker**: Phases 6.1-6.4

#### Tasks

##### Task 6.5.1: End-to-End Integration Testing
**Effort**: 8 hours

Test complete data flow:
1. Parse JSONL files with Claude Code 2.0 features
2. Insert to all tables
3. Query via API
4. Display in frontend
5. Verify accuracy

##### Task 6.5.2: Unit Tests for Query Builder
**Effort**: 6 hours

Create tests for all 6 new query methods:
```typescript
// tests/unit/query-builder-claude-code-2.test.ts
describe('Claude Code 2.0 Query Methods', () => {
  it('should get checkpoint analytics', async () => {
    const analytics = await queryBuilder.getCheckpointAnalytics();
    expect(analytics.totalCheckpoints).toBeGreaterThan(0);
  });

  // ... 5 more test suites
});
```

##### Task 6.5.3: API Integration Tests
**Effort**: 6 hours

Test all new endpoints:
```typescript
// tests/integration/claude-code-2-api.test.ts
describe('Claude Code 2.0 API Endpoints', () => {
  it('GET /api/analytics/checkpoints should return data', async () => {
    const response = await request(app).get('/api/analytics/checkpoints');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // ... 5 more endpoint tests
});
```

##### Task 6.5.4: Frontend Component Tests
**Effort**: 5 hours

Test rendering and interactions:
```typescript
// tests/frontend/CheckpointTimeline.test.tsx
describe('CheckpointTimeline', () => {
  it('should render checkpoint data', () => {
    render(<CheckpointTimeline sessionId="123" />);
    expect(screen.getByText('Total Checkpoints')).toBeInTheDocument();
  });
});
```

---

### Phase 6.6: Documentation & Polish (Week 11-12)
**Effort**: 15 hours | **Priority**: MEDIUM | **Blocker**: Phase 6.5

#### Tasks

##### Task 6.6.1: Update README.md
**Effort**: 3 hours

- Update feature list with Claude Code 2.0
- Add screenshots of new components
- Update API documentation
- Add usage examples

##### Task 6.6.2: Create CLAUDE_CODE_2_GUIDE.md
**Effort**: 4 hours

Already exists - update with:
- Actual implementation details
- Real API examples
- Troubleshooting section
- Performance tips

##### Task 6.6.3: Update TODOs.md
**Effort**: 2 hours

Mark Phase 6 as 100% complete (for real this time!)

##### Task 6.6.4: Create Migration Guide
**Effort**: 3 hours

Help users migrate from 1.0 to 2.0:
- Database migration steps
- Breaking changes
- New features guide

##### Task 6.6.5: Add Inline Documentation
**Effort**: 3 hours

- JSDoc comments for all new methods
- TypeScript documentation
- Component prop documentation

---

## Risk Management

### High Risks
1. **No Real Claude Code 2.0 Data to Test**
   - **Mitigation**: Create mock JSONL files following documented format
   - **Backup**: Build with best assumptions, iterate when real data available

2. **Parser May Not Extract Data Correctly**
   - **Mitigation**: Review parser code in detail (Task 6.0)
   - **Backup**: Add extensive logging to debug issues

3. **Database Performance with Large Datasets**
   - **Mitigation**: Add proper indexes from start
   - **Backup**: Implement pagination aggressively

### Medium Risks
1. **Frontend Complexity**
   - **Mitigation**: Reuse existing chart components
   - **Backup**: Start with simpler visualizations

2. **API Response Times**
   - **Mitigation**: Implement caching early
   - **Backup**: Add loading states everywhere

---

## Success Criteria

### Phase 6.1 Complete When:
- ✅ All 4 feature tables receiving data
- ✅ Raw messages includes all 6 new fields
- ✅ Sample JSONL file processed without errors
- ✅ Database inspection shows data in all tables

### Phase 6.2 Complete When:
- ✅ All 6 new query methods functional
- ✅ Existing methods enhanced with new filters
- ✅ Query performance < 500ms for typical datasets
- ✅ TypeScript compilation succeeds

### Phase 6.3 Complete When:
- ✅ All 5 new endpoints responding
- ✅ Filters working correctly
- ✅ Error handling comprehensive
- ✅ Postman/curl tests pass

### Phase 6.4 Complete When:
- ✅ All 5 new components rendering
- ✅ Filters UI functional
- ✅ Mobile responsive
- ✅ No console errors

### Phase 6.5 Complete When:
- ✅ End-to-end flow verified
- ✅ All tests passing
- ✅ Test coverage > 70%
- ✅ No critical bugs

### Phase 6.6 Complete When:
- ✅ Documentation updated
- ✅ README accurate
- ✅ Migration guide complete
- ✅ Ready for publication

---

## Timeline & Milestones

```
Week 1-2:  Database Layer (Phase 6.1)
Week 3-4:  Query Builder (Phase 6.2)
Week 4-5:  API Endpoints (Phase 6.3)
Week 6-8:  Frontend Components (Phase 6.4)
Week 9-10: Testing & Integration (Phase 6.5)
Week 11-12: Documentation & Polish (Phase 6.6)

Total: 12 weeks (160 hours estimated)
```

### Key Milestones
- **M1 (Week 2)**: Data flowing to all tables ✓
- **M2 (Week 4)**: API endpoints functional ✓
- **M3 (Week 8)**: Frontend complete ✓
- **M4 (Week 10)**: All tests passing ✓
- **M5 (Week 12)**: Ready for publication ✓

---

## Next Immediate Steps

1. **Install Dependencies**
   ```bash
   cd /home/user/claude-code-analytics
   npm install
   cd frontend && npm install
   ```

2. **Fix Build Errors**
   - Resolve TypeScript compilation issues
   - Ensure both backend and frontend build

3. **Create Mock Data**
   - Generate sample Claude Code 2.0 JSONL files
   - Test parser extraction

4. **Start Phase 6.1 Task 6.1.2**
   - Enhance raw_messages insertion
   - Verify data reaches database

---

## Questions & Decisions Needed

1. **Do you have access to real Claude Code 2.0 JSONL files?**
   - If yes: Use for testing
   - If no: Create comprehensive mocks

2. **Priority order for features?**
   - Suggested: Checkpoints → Subagents → Background Tasks → VS Code
   - Or: All in parallel?

3. **Testing depth?**
   - Minimal (smoke tests only)
   - Moderate (key paths covered)
   - Comprehensive (>80% coverage)

4. **Timeline flexibility?**
   - Strict 12 weeks?
   - Or adjust based on progress?

---

This plan provides a complete roadmap from 30% to 100% implementation. Ready to start executing?
