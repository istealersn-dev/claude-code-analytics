-- Claude Code Analytics Database Schema - Enhanced for Claude Code 2.0
-- Created for tracking personal Claude Code CLI usage with Claude Code 2.0 features

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS raw_messages CASCADE;
DROP TABLE IF EXISTS session_metrics CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS sync_metadata CASCADE;
DROP TABLE IF EXISTS checkpoints CASCADE;
DROP TABLE IF EXISTS background_tasks CASCADE;
DROP TABLE IF EXISTS subagents CASCADE;
DROP TABLE IF EXISTS vscode_integrations CASCADE;

-- Core sessions table - enhanced for Claude Code 2.0
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    project_name VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    model_name VARCHAR(100),
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 6) DEFAULT 0.00,
    tools_used TEXT[], -- Array of tool names
    cache_hit_count INTEGER DEFAULT 0,
    cache_miss_count INTEGER DEFAULT 0,
    -- Claude Code 2.0 enhancements
    is_extended_session BOOLEAN DEFAULT FALSE, -- 30+ hour sessions
    has_background_tasks BOOLEAN DEFAULT FALSE,
    has_subagents BOOLEAN DEFAULT FALSE,
    has_vscode_integration BOOLEAN DEFAULT FALSE,
    session_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'extended', 'autonomous'
    autonomy_level INTEGER DEFAULT 0, -- 0-10 scale of AI autonomy
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checkpoints table for Claude Code 2.0 rewind functionality
CREATE TABLE checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    checkpoint_id VARCHAR(255) NOT NULL,
    checkpoint_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    file_snapshot JSONB, -- Snapshot of file states
    code_changes JSONB, -- Summary of changes made
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0.00,
    is_rewind_point BOOLEAN DEFAULT FALSE, -- Can be reverted to
    rewind_count INTEGER DEFAULT 0, -- How many times this checkpoint was used for rewind
    created_at_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Background tasks for long-running processes
CREATE TABLE background_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    task_id VARCHAR(255) NOT NULL,
    task_name VARCHAR(255),
    task_type VARCHAR(100), -- 'code_generation', 'testing', 'refactoring', 'documentation'
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed', 'paused'
    progress_percentage INTEGER DEFAULT 0,
    description TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0.00,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subagents for parallel development
CREATE TABLE subagents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    subagent_id VARCHAR(255) NOT NULL,
    subagent_name VARCHAR(255),
    subagent_type VARCHAR(100), -- 'frontend', 'backend', 'testing', 'documentation', 'review'
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'failed', 'paused'
    tasks_assigned TEXT[], -- Array of task descriptions
    tasks_completed TEXT[], -- Array of completed tasks
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0.00,
    efficiency_score DECIMAL(5, 2), -- 0-100 efficiency rating
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VS Code integration tracking
CREATE TABLE vscode_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    integration_id VARCHAR(255) NOT NULL,
    extension_version VARCHAR(50),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    features_used TEXT[], -- Array of VS Code features used
    file_operations INTEGER DEFAULT 0, -- Number of file operations
    diff_views INTEGER DEFAULT 0, -- Number of diff views opened
    inline_suggestions INTEGER DEFAULT 0, -- Number of inline suggestions
    sidebar_interactions INTEGER DEFAULT 0, -- Number of sidebar interactions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flattened analytics data for fast queries - enhanced for Claude Code 2.0
CREATE TABLE session_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    date_bucket DATE NOT NULL, -- Daily aggregation
    hour_bucket INTEGER NOT NULL, -- Hour of day (0-23)
    weekday INTEGER NOT NULL, -- Day of week (0-6, Sunday=0)
    week_of_year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0.00,
    duration_seconds INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    tool_usage_count INTEGER DEFAULT 0,
    cache_efficiency DECIMAL(5, 4) DEFAULT 0.00, -- cache_hits / (cache_hits + cache_misses)
    -- Claude Code 2.0 metrics
    checkpoint_count INTEGER DEFAULT 0,
    rewind_count INTEGER DEFAULT 0,
    background_task_count INTEGER DEFAULT 0,
    subagent_count INTEGER DEFAULT 0,
    vscode_integration_count INTEGER DEFAULT 0,
    autonomy_score DECIMAL(5, 2) DEFAULT 0.00, -- Average autonomy level
    parallel_development_efficiency DECIMAL(5, 2) DEFAULT 0.00, -- Subagent efficiency
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed conversation data for drill-down analysis - enhanced for Claude Code 2.0
CREATE TABLE raw_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    message_index INTEGER NOT NULL, -- Order within session
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'tool', 'subagent', 'background_task'
    content TEXT, -- Message content (truncated for large messages)
    content_length INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    tool_name VARCHAR(255),
    tool_input TEXT, -- Tool parameters
    tool_output TEXT, -- Tool results (truncated)
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    processing_time_ms INTEGER, -- Time taken to process this message
    -- Claude Code 2.0 enhancements
    checkpoint_id VARCHAR(255), -- Associated checkpoint if applicable
    subagent_id VARCHAR(255), -- Associated subagent if applicable
    background_task_id VARCHAR(255), -- Associated background task if applicable
    vscode_integration_id VARCHAR(255), -- Associated VS Code integration if applicable
    is_rewind_trigger BOOLEAN DEFAULT FALSE, -- Message that triggered a rewind
    autonomy_level INTEGER DEFAULT 0, -- Autonomy level when this message was created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance - enhanced for Claude Code 2.0
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_sessions_project_name ON sessions(project_name);
CREATE INDEX idx_sessions_model_name ON sessions(model_name);
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_is_extended ON sessions(is_extended_session);
CREATE INDEX idx_sessions_session_type ON sessions(session_type);
CREATE INDEX idx_sessions_autonomy_level ON sessions(autonomy_level);

CREATE UNIQUE INDEX idx_session_metrics_session_id_unique ON session_metrics(session_id);
CREATE INDEX idx_session_metrics_date_bucket ON session_metrics(date_bucket);
CREATE INDEX idx_session_metrics_hour_bucket ON session_metrics(hour_bucket);
CREATE INDEX idx_session_metrics_weekday ON session_metrics(weekday);

CREATE INDEX idx_raw_messages_session_id ON raw_messages(session_id);
CREATE INDEX idx_raw_messages_timestamp ON raw_messages(timestamp);
CREATE INDEX idx_raw_messages_role ON raw_messages(role);
CREATE INDEX idx_raw_messages_tool_name ON raw_messages(tool_name);
CREATE INDEX idx_raw_messages_checkpoint_id ON raw_messages(checkpoint_id);
CREATE INDEX idx_raw_messages_subagent_id ON raw_messages(subagent_id);
CREATE INDEX idx_raw_messages_background_task_id ON raw_messages(background_task_id);

-- Claude Code 2.0 specific indexes
CREATE INDEX idx_checkpoints_session_id ON checkpoints(session_id);
CREATE INDEX idx_checkpoints_created_at ON checkpoints(created_at);
CREATE INDEX idx_checkpoints_is_rewind_point ON checkpoints(is_rewind_point);

CREATE INDEX idx_background_tasks_session_id ON background_tasks(session_id);
CREATE INDEX idx_background_tasks_status ON background_tasks(status);
CREATE INDEX idx_background_tasks_task_type ON background_tasks(task_type);

CREATE INDEX idx_subagents_session_id ON subagents(session_id);
CREATE INDEX idx_subagents_status ON subagents(status);
CREATE INDEX idx_subagents_subagent_type ON subagents(subagent_type);

CREATE INDEX idx_vscode_integrations_session_id ON vscode_integrations(session_id);
CREATE INDEX idx_vscode_integrations_started_at ON vscode_integrations(started_at);

-- Enhanced trigger to automatically update session metrics when sessions are updated
CREATE OR REPLACE FUNCTION update_session_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete existing metrics for this session
    DELETE FROM session_metrics WHERE session_id = NEW.id;
    
    -- Insert new metrics with Claude Code 2.0 enhancements
    INSERT INTO session_metrics (
        session_id, date_bucket, hour_bucket, weekday, week_of_year, 
        month, year, input_tokens, output_tokens, cost_usd, 
        duration_seconds, cache_efficiency, checkpoint_count, rewind_count,
        background_task_count, subagent_count, vscode_integration_count,
        autonomy_score, parallel_development_efficiency
    )
    SELECT 
        NEW.id,
        DATE(NEW.started_at) as date_bucket,
        EXTRACT(HOUR FROM NEW.started_at) as hour_bucket,
        EXTRACT(DOW FROM NEW.started_at) as weekday,
        EXTRACT(WEEK FROM NEW.started_at) as week_of_year,
        EXTRACT(MONTH FROM NEW.started_at) as month,
        EXTRACT(YEAR FROM NEW.started_at) as year,
        COALESCE(NEW.total_input_tokens, 0),
        COALESCE(NEW.total_output_tokens, 0),
        COALESCE(NEW.total_cost_usd, 0),
        COALESCE(NEW.duration_seconds, 0),
        CASE 
            WHEN (COALESCE(NEW.cache_hit_count, 0) + COALESCE(NEW.cache_miss_count, 0)) > 0 
            THEN NEW.cache_hit_count::DECIMAL / (NEW.cache_hit_count + NEW.cache_miss_count)
            ELSE 0 
        END,
        -- Claude Code 2.0 metrics
        (SELECT COUNT(*) FROM checkpoints WHERE session_id = NEW.id),
        (SELECT COALESCE(SUM(rewind_count), 0) FROM checkpoints WHERE session_id = NEW.id),
        (SELECT COUNT(*) FROM background_tasks WHERE session_id = NEW.id),
        (SELECT COUNT(*) FROM subagents WHERE session_id = NEW.id),
        (SELECT COUNT(*) FROM vscode_integrations WHERE session_id = NEW.id),
        COALESCE(NEW.autonomy_level, 0),
        CASE 
            WHEN (SELECT COUNT(*) FROM subagents WHERE session_id = NEW.id) > 0
            THEN (SELECT AVG(efficiency_score) FROM subagents WHERE session_id = NEW.id)
            ELSE 0
        END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_metrics
    AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_metrics();

-- Add updated_at trigger for sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sync metadata for incremental data processing
CREATE TABLE sync_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_key VARCHAR(255) UNIQUE NOT NULL, -- 'global' for full syncs, file paths for file-specific
    last_sync_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    files_processed INTEGER DEFAULT 0,
    sessions_processed INTEGER DEFAULT 0,
    sync_status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'in_progress', 'failed'
    error_message TEXT,
    -- Claude Code 2.0 sync enhancements
    checkpoints_processed INTEGER DEFAULT 0,
    background_tasks_processed INTEGER DEFAULT 0,
    subagents_processed INTEGER DEFAULT 0,
    vscode_integrations_processed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sync metadata
CREATE INDEX idx_sync_metadata_sync_key ON sync_metadata(sync_key);
CREATE INDEX idx_sync_metadata_last_sync ON sync_metadata(last_sync_timestamp);

-- Trigger for sync metadata updated_at
CREATE TRIGGER trigger_sync_metadata_updated_at
    BEFORE UPDATE ON sync_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data retention policy (90 days as specified)
-- This will be implemented as a scheduled job later
COMMENT ON TABLE sessions IS 'Core session metadata with 90-day retention policy - Enhanced for Claude Code 2.0';
COMMENT ON TABLE session_metrics IS 'Pre-aggregated analytics data for fast dashboard queries - Enhanced for Claude Code 2.0';
COMMENT ON TABLE raw_messages IS 'Detailed message data for drill-down analysis - Enhanced for Claude Code 2.0';
COMMENT ON TABLE sync_metadata IS 'Tracks last sync timestamps for incremental data processing - Enhanced for Claude Code 2.0';
COMMENT ON TABLE checkpoints IS 'Claude Code 2.0 checkpoint and rewind functionality tracking';
COMMENT ON TABLE background_tasks IS 'Claude Code 2.0 background task monitoring for long-running processes';
COMMENT ON TABLE subagents IS 'Claude Code 2.0 subagent tracking for parallel development';
COMMENT ON TABLE vscode_integrations IS 'Claude Code 2.0 VS Code extension integration tracking';
