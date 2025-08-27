-- Claude Code Analytics Database Schema
-- Created for tracking personal Claude Code CLI usage

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS raw_messages CASCADE;
DROP TABLE IF EXISTS session_metrics CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Core sessions table - metadata and timing
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flattened analytics data for fast queries
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed conversation data for drill-down analysis
CREATE TABLE raw_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    message_index INTEGER NOT NULL, -- Order within session
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'tool', etc.
    content TEXT, -- Message content (truncated for large messages)
    content_length INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    tool_name VARCHAR(255),
    tool_input TEXT, -- Tool parameters
    tool_output TEXT, -- Tool results (truncated)
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    processing_time_ms INTEGER, -- Time taken to process this message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_sessions_project_name ON sessions(project_name);
CREATE INDEX idx_sessions_model_name ON sessions(model_name);
CREATE INDEX idx_sessions_session_id ON sessions(session_id);

CREATE UNIQUE INDEX idx_session_metrics_session_id_unique ON session_metrics(session_id);
CREATE INDEX idx_session_metrics_date_bucket ON session_metrics(date_bucket);
CREATE INDEX idx_session_metrics_hour_bucket ON session_metrics(hour_bucket);
CREATE INDEX idx_session_metrics_weekday ON session_metrics(weekday);

CREATE INDEX idx_raw_messages_session_id ON raw_messages(session_id);
CREATE INDEX idx_raw_messages_timestamp ON raw_messages(timestamp);
CREATE INDEX idx_raw_messages_role ON raw_messages(role);
CREATE INDEX idx_raw_messages_tool_name ON raw_messages(tool_name);

-- Trigger to automatically update session metrics when sessions are updated
CREATE OR REPLACE FUNCTION update_session_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete existing metrics for this session
    DELETE FROM session_metrics WHERE session_id = NEW.id;
    
    -- Insert new metrics
    INSERT INTO session_metrics (
        session_id, date_bucket, hour_bucket, weekday, week_of_year, 
        month, year, input_tokens, output_tokens, cost_usd, 
        duration_seconds, cache_efficiency
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

-- Sample data retention policy (90 days as specified)
-- This will be implemented as a scheduled job later
COMMENT ON TABLE sessions IS 'Core session metadata with 90-day retention policy';
COMMENT ON TABLE session_metrics IS 'Pre-aggregated analytics data for fast dashboard queries';
COMMENT ON TABLE raw_messages IS 'Detailed message data for drill-down analysis';
