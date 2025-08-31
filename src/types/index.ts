export interface ClaudeCodeSession {
  session_id: string;
  project_name?: string;
  started_at: string;
  ended_at?: string;
  model_name?: string;
  messages: ClaudeCodeMessage[];
  metadata?: SessionMetadata;
}

export interface ClaudeCodeMessage {
  role: 'user' | 'assistant' | 'tool';
  content?: string;
  timestamp: string;
  tokens?: {
    input?: number;
    output?: number;
  };
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  cache_stats?: CacheStats;
  processing_time_ms?: number;
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
  cache_hits?: number;
  cache_misses?: number;
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
  session: DatabaseSession;
  messages: DatabaseMessage[];
  metrics: SessionMetrics;
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
