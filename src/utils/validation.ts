import type { DatabaseSession, ParseError } from '../types/index.js';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DataValidator {
  static validateMessage(data: any, lineNumber?: number): ParseError[] {
    const errors: ParseError[] = [];
    const filePath = 'unknown';

    if (!data || typeof data !== 'object') {
      errors.push({
        file_path: filePath,
        line_number: lineNumber,
        error_type: 'INVALID_DATA',
        message: 'Message data must be an object',
      });
      return errors;
    }

    if (!data.role || typeof data.role !== 'string') {
      errors.push({
        file_path: filePath,
        line_number: lineNumber,
        error_type: 'MISSING_FIELD',
        message: 'Message role is required and must be a string',
      });
    } else if (!['user', 'assistant', 'tool'].includes(data.role)) {
      errors.push({
        file_path: filePath,
        line_number: lineNumber,
        error_type: 'INVALID_DATA',
        message: `Invalid role "${data.role}". Must be one of: user, assistant, tool`,
      });
    }

    if (data.timestamp && !DataValidator.isValidTimestamp(data.timestamp)) {
      errors.push({
        file_path: filePath,
        line_number: lineNumber,
        error_type: 'INVALID_DATA',
        message: 'Invalid timestamp format. Expected ISO 8601 string or Unix timestamp',
      });
    }

    if (data.tokens) {
      if (typeof data.tokens !== 'object') {
        errors.push({
          file_path: filePath,
          line_number: lineNumber,
          error_type: 'INVALID_DATA',
          message: 'Tokens field must be an object',
        });
      } else {
        if (
          data.tokens.input !== undefined &&
          (!Number.isInteger(data.tokens.input) || data.tokens.input < 0)
        ) {
          errors.push({
            file_path: filePath,
            line_number: lineNumber,
            error_type: 'INVALID_DATA',
            message: 'Input tokens must be a non-negative integer',
          });
        }

        if (
          data.tokens.output !== undefined &&
          (!Number.isInteger(data.tokens.output) || data.tokens.output < 0)
        ) {
          errors.push({
            file_path: filePath,
            line_number: lineNumber,
            error_type: 'INVALID_DATA',
            message: 'Output tokens must be a non-negative integer',
          });
        }
      }
    }

    if (data.tool_calls && !Array.isArray(data.tool_calls)) {
      errors.push({
        file_path: filePath,
        line_number: lineNumber,
        error_type: 'INVALID_DATA',
        message: 'Tool calls must be an array',
      });
    }

    if (
      data.processing_time_ms !== undefined &&
      (!Number.isInteger(data.processing_time_ms) || data.processing_time_ms < 0)
    ) {
      errors.push({
        file_path: filePath,
        line_number: lineNumber,
        error_type: 'INVALID_DATA',
        message: 'Processing time must be a non-negative integer',
      });
    }

    return errors;
  }

  static validateSession(session: DatabaseSession): ParseError[] {
    const errors: ParseError[] = [];
    const filePath = 'session_validation';

    if (
      !session.session_id ||
      typeof session.session_id !== 'string' ||
      session.session_id.trim().length === 0
    ) {
      errors.push({
        file_path: filePath,
        error_type: 'MISSING_FIELD',
        message: 'Session ID is required and must be a non-empty string',
      });
    }

    if (
      !session.started_at ||
      !(session.started_at instanceof Date) ||
      Number.isNaN(session.started_at.getTime())
    ) {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'Started at must be a valid Date object',
      });
    }

    if (
      session.ended_at &&
      (!(session.ended_at instanceof Date) || Number.isNaN(session.ended_at.getTime()))
    ) {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'Ended at must be a valid Date object',
      });
    }

    if (session.started_at && session.ended_at && session.started_at >= session.ended_at) {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'Session start time must be before end time',
      });
    }

    if (
      session.duration_seconds !== undefined &&
      (!Number.isInteger(session.duration_seconds) || session.duration_seconds < 0)
    ) {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'Duration must be a non-negative integer',
      });
    }

    if (session.total_input_tokens < 0 || !Number.isInteger(session.total_input_tokens)) {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'Total input tokens must be a non-negative integer',
      });
    }

    if (session.total_output_tokens < 0 || !Number.isInteger(session.total_output_tokens)) {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'Total output tokens must be a non-negative integer',
      });
    }

    if (session.total_cost_usd < 0 || typeof session.total_cost_usd !== 'number') {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'Total cost must be a non-negative number',
      });
    }

    if (!Array.isArray(session.tools_used)) {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'Tools used must be an array',
      });
    } else {
      session.tools_used.forEach((tool, index) => {
        if (typeof tool !== 'string') {
          errors.push({
            file_path: filePath,
            error_type: 'INVALID_DATA',
            message: `Tool at index ${index} must be a string`,
          });
        }
      });
    }

    if (session.cache_hit_count < 0 || !Number.isInteger(session.cache_hit_count)) {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'Cache hit count must be a non-negative integer',
      });
    }

    if (session.cache_miss_count < 0 || !Number.isInteger(session.cache_miss_count)) {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'Cache miss count must be a non-negative integer',
      });
    }

    return errors;
  }

  static sanitizeString(value: string, maxLength: number = 1000): string {
    if (typeof value !== 'string') {
      return String(value);
    }

    return value.slice(0, maxLength).trim();
  }

  static sanitizeNumber(value: any, defaultValue: number = 0): number {
    const num = Number(value);
    return Number.isNaN(num) ? defaultValue : Math.max(0, num);
  }

  static sanitizeArray(value: any, defaultValue: any[] = []): any[] {
    return Array.isArray(value) ? value : defaultValue;
  }

  static isValidTimestamp(timestamp: any): boolean {
    if (!timestamp) return false;

    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return !Number.isNaN(date.getTime());
    }

    if (typeof timestamp === 'number') {
      const date = new Date(timestamp);
      return !Number.isNaN(date.getTime()) && timestamp > 0;
    }

    return false;
  }

  static normalizeTimestamp(timestamp: any): Date {
    if (!timestamp) {
      return new Date();
    }

    if (timestamp instanceof Date) {
      return timestamp;
    }

    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      const date = new Date(timestamp);
      return Number.isNaN(date.getTime()) ? new Date() : date;
    }

    return new Date();
  }

  static validateFileStructure(filePath: string, content: string): ParseError[] {
    const errors: ParseError[] = [];

    if (!content || content.trim().length === 0) {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'File is empty',
      });
      return errors;
    }

    const lines = content.trim().split('\n');
    let validJsonCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim().length === 0) continue;
      
      const trimmedLine = line.trim();

      try {
        JSON.parse(trimmedLine);
        validJsonCount++;
      } catch (error) {
        errors.push({
          file_path: filePath,
          line_number: i + 1,
          error_type: 'MALFORMED_JSON',
          message: `Invalid JSON on line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          raw_data: trimmedLine,
        });
      }
    }

    if (validJsonCount === 0) {
      errors.push({
        file_path: filePath,
        error_type: 'INVALID_DATA',
        message: 'No valid JSON lines found in file',
      });
    }

    return errors;
  }
}
