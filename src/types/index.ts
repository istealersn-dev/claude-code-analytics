export interface ClaudeCodeSession {
  session_id: string;
  project_name?: string;
  started_at: string;
  ended_at?: string;
  model_name?: string;
  messages: ClaudeCodeMessage[];
  metadata?: SessionMetadata;
  // Claude Code 2.0 enhancements
  is_extended_session?: boolean;
  has_background_tasks?: boolean;
  has_subagents?: boolean;
  has_vscode_integration?: boolean;
  session_type?: 'standard' | 'extended' | 'autonomous';
  autonomy_level?: number;
  checkpoints?: Checkpoint[];
  background_tasks?: BackgroundTask[];
  subagents?: Subagent[];
  vscode_integrations?: VSCodeIntegration[];
}

export interface ClaudeCodeMessage {
  role: 'user' | 'assistant' | 'tool' | 'subagent' | 'background_task';
  content?: string;
  timestamp: string;
  model?: string;
  tokens?: {
    input?: number;
    output?: number;
  };
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  cache_stats?: CacheStats;
  processing_time_ms?: number;
  // Claude Code 2.0 enhancements
  checkpoint_id?: string;
  subagent_id?: string;
  background_task_id?: string;
  vscode_integration_id?: string;
  is_rewind_trigger?: boolean;
  autonomy_level?: number;
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  id?: string;
}

export interface ToolResult {
  tool_call_id?: string;
  content: string | Record<string, unknown>;
  error?: string;
}

export interface CacheStats {
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface SessionMetadata {
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_cost_usd?: number;
  duration_seconds?: number;
  tools_used?: string[];
  cache_efficiency?: number;
}

export interface DatabaseSession {
  id?: string;
  session_id: string;
  project_name?: string;
  started_at: Date;
  ended_at?: Date;
  duration_seconds?: number;
  model_name?: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  tools_used: string[];
  cache_hit_count: number;
  cache_miss_count: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface DatabaseMessage {
  id?: string;
  session_id: string;
  message_index: number;
  role: string;
  content?: string;
  content_length: number;
  input_tokens: number;
  output_tokens: number;
  tool_name?: string;
  tool_input?: string;
  tool_output?: string;
  timestamp: Date;
  processing_time_ms?: number;
  created_at?: Date;
}

export interface ParsedSessionData {
  session: DatabaseSessionEnhanced;
  messages: DatabaseMessageEnhanced[];
  metrics: SessionMetricsEnhanced;
}

export interface SessionMetrics {
  session_id: string;
  date_bucket: Date;
  hour_bucket: number;
  weekday: number;
  week_of_year: number;
  month: number;
  year: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  duration_seconds: number;
  message_count: number;
  tool_usage_count: number;
  cache_efficiency: number;
}

export interface ParseError {
  file_path: string;
  line_number?: number;
  error_type: 'MALFORMED_JSON' | 'MISSING_FIELD' | 'INVALID_DATA' | 'FILE_ACCESS';
  message: string;
  raw_data?: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedSessionData;
  errors: ParseError[];
  warnings: string[];
}

export interface SyncMetadata {
  id?: string;
  sync_key: string;
  last_sync_timestamp: Date;
  files_processed: number;
  sessions_processed: number;
  sync_status: 'completed' | 'in_progress' | 'failed';
  error_message?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface FileInfo {
  path: string;
  modified_time: Date;
  size: number;
  is_new: boolean;
  is_updated: boolean;
}

// Claude Code 2.0 Enhanced Interfaces

export interface Checkpoint {
  id?: string;
  session_id: string;
  checkpoint_id: string;
  checkpoint_name?: string;
  created_at: Date;
  description?: string;
  file_snapshot?: Record<string, unknown>;
  code_changes?: Record<string, unknown>;
  tokens_used: number;
  cost_usd: number;
  is_rewind_point: boolean;
  rewind_count: number;
  created_at_timestamp?: Date;
}

export interface BackgroundTask {
  id?: string;
  session_id: string;
  task_id: string;
  task_name?: string;
  task_type:
    | 'code_generation'
    | 'testing'
    | 'refactoring'
    | 'documentation'
    | 'review'
    | 'optimization';
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress_percentage: number;
  description?: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  error_message?: string;
  created_at?: Date;
}

export interface Subagent {
  id?: string;
  session_id: string;
  subagent_id: string;
  subagent_name?: string;
  subagent_type: 'frontend' | 'backend' | 'testing' | 'documentation' | 'review' | 'optimization';
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
  status: 'active' | 'completed' | 'failed' | 'paused';
  tasks_assigned: string[];
  tasks_completed: string[];
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  efficiency_score?: number;
  created_at?: Date;
}

export interface VSCodeIntegration {
  id?: string;
  session_id: string;
  integration_id: string;
  extension_version?: string;
  started_at: Date;
  ended_at?: Date;
  duration_seconds?: number;
  features_used: string[];
  file_operations: number;
  diff_views: number;
  inline_suggestions: number;
  sidebar_interactions: number;
  created_at?: Date;
}

export interface DatabaseSessionEnhanced extends DatabaseSession {
  is_extended_session: boolean;
  has_background_tasks: boolean;
  has_subagents: boolean;
  has_vscode_integration: boolean;
  session_type: 'standard' | 'extended' | 'autonomous';
  autonomy_level: number;
}

export interface SessionMetricsEnhanced extends SessionMetrics {
  checkpoint_count: number;
  rewind_count: number;
  background_task_count: number;
  subagent_count: number;
  vscode_integration_count: number;
  autonomy_score: number;
  parallel_development_efficiency: number;
}

export interface DatabaseMessageEnhanced extends DatabaseMessage {
  checkpoint_id?: string;
  subagent_id?: string;
  background_task_id?: string;
  vscode_integration_id?: string;
  is_rewind_trigger: boolean;
  autonomy_level: number;
}
