import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  ClaudeCodeMessage,
  DatabaseMessage,
  DatabaseSession,
  ParsedSessionData,
  ParseError,
  ParseResult,
  SessionMetrics,
} from '../types/index.js';

export class JSONLParser {
  private readonly CLAUDE_PROJECTS_PATH = path.join(
    process.env['HOME'] || '~',
    '.claude',
    'projects',
  );

  async parseSessionFile(filePath: string): Promise<ParseResult> {
    const errors: ParseError[] = [];
    const warnings: string[] = [];

    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          errors: [
            {
              file_path: filePath,
              error_type: 'FILE_ACCESS',
              message: `File not found: ${filePath}`,
            },
          ],
          warnings: [],
        };
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent
        .trim()
        .split('\n')
        .filter((line: string) => line.trim());

      if (lines.length === 0) {
        return {
          success: false,
          errors: [
            {
              file_path: filePath,
              error_type: 'INVALID_DATA',
              message: 'File is empty or contains no valid JSONL data',
            },
          ],
          warnings: [],
        };
      }

      const messages: ClaudeCodeMessage[] = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          const line = lines[i];
          if (!line) continue;
          const parsedLine = JSON.parse(line);
          const message = this.parseMessage(parsedLine, i + 1);
          if (message) {
            messages.push(message);
          }
        } catch (error) {
          errors.push({
            file_path: filePath,
            line_number: i + 1,
            error_type: 'MALFORMED_JSON',
            message: `Failed to parse JSON on line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            raw_data: lines[i] || '',
          });
        }
      }

      if (messages.length === 0) {
        return {
          success: false,
          errors:
            errors.length > 0
              ? errors
              : [
                  {
                    file_path: filePath,
                    error_type: 'INVALID_DATA',
                    message: 'No valid messages found in file',
                  },
                ],
          warnings: warnings,
        };
      }

      const sessionData = this.buildSessionFromMessages(filePath, messages);

      return {
        success: true,
        data: sessionData,
        errors: errors,
        warnings: warnings,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            file_path: filePath,
            error_type: 'FILE_ACCESS',
            message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        warnings: [],
      };
    }
  }

  private parseMessage(data: unknown, _lineNumber: number): ClaudeCodeMessage | null {
    if (!data || typeof data !== 'object') return null;

    const obj = data as any;

    const message: ClaudeCodeMessage = {
      role: obj.role || 'assistant',
      content: obj.content || obj.text || '',
      timestamp: obj.timestamp || obj.created_at || new Date().toISOString(),
      tokens: {
        input: obj.tokens?.input || obj.input_tokens || 0,
        output: obj.tokens?.output || obj.output_tokens || 0,
      },
      processing_time_ms: obj.processing_time_ms || obj.duration_ms,
    };

    if (obj.tool_calls) {
      message.tool_calls = Array.isArray(obj.tool_calls) ? obj.tool_calls : [obj.tool_calls];
    }

    if (obj.tool_results) {
      message.tool_results = Array.isArray(obj.tool_results)
        ? obj.tool_results
        : [obj.tool_results];
    }

    if (obj.cache_stats || obj.cache) {
      const cacheData = obj.cache_stats || obj.cache;
      message.cache_stats = {
        cache_creation_input_tokens: cacheData.cache_creation_input_tokens || 0,
        cache_read_input_tokens: cacheData.cache_read_input_tokens || 0,
        cache_hits: cacheData.cache_hits || 0,
        cache_misses: cacheData.cache_misses || 0,
      };
    }

    return message;
  }

  private buildSessionFromMessages(
    filePath: string,
    messages: ClaudeCodeMessage[],
  ): ParsedSessionData {
    const fileName = path.basename(filePath, '.jsonl');
    const sessionId = fileName.includes('session_') ? fileName : `session_${fileName}`;
    const projectName = this.extractProjectName(filePath);

    const sortedMessages = messages.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const firstMessage = sortedMessages[0];
    const lastMessage = sortedMessages[sortedMessages.length - 1];

    if (!firstMessage || !lastMessage) {
      throw new Error('No messages found to build session from');
    }

    const startTime = new Date(firstMessage.timestamp);
    const endTime = new Date(lastMessage.timestamp);
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheHits = 0;
    let totalCacheMisses = 0;
    const toolsUsed = new Set<string>();

    const databaseMessages: DatabaseMessage[] = sortedMessages.map((msg, index) => {
      const inputTokens = msg.tokens?.input || 0;
      const outputTokens = msg.tokens?.output || 0;

      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;

      if (msg.cache_stats) {
        totalCacheHits += msg.cache_stats.cache_hits || 0;
        totalCacheMisses += msg.cache_stats.cache_misses || 0;
      }

      if (msg.tool_calls) {
        for (const tool of msg.tool_calls) {
          if (tool && typeof tool === 'object' && 'name' in tool) {
            toolsUsed.add(tool.name as string);
          }
        }
      }

      return {
        session_id: sessionId,
        message_index: index,
        role: msg.role,
        content: msg.content || '',
        content_length: msg.content?.length || 0,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        tool_name: msg.tool_calls?.[0]?.name,
        tool_input: msg.tool_calls?.[0] ? JSON.stringify(msg.tool_calls[0].input) : undefined,
        tool_output: msg.tool_results?.[0]
          ? JSON.stringify(msg.tool_results[0].content)
          : undefined,
        timestamp: new Date(msg.timestamp),
        processing_time_ms: msg.processing_time_ms,
      };
    });

    const totalCost = this.calculateCost(
      totalInputTokens,
      totalOutputTokens,
      this.detectModel(messages),
    );

    const session: DatabaseSession = {
      session_id: sessionId,
      project_name: projectName || undefined,
      started_at: startTime,
      ended_at: endTime,
      duration_seconds: durationSeconds,
      model_name: this.detectModel(messages),
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
      total_cost_usd: totalCost,
      tools_used: Array.from(toolsUsed),
      cache_hit_count: totalCacheHits,
      cache_miss_count: totalCacheMisses,
    };

    const metrics: SessionMetrics = {
      session_id: sessionId,
      date_bucket: new Date(startTime.toDateString()),
      hour_bucket: startTime.getHours(),
      weekday: startTime.getDay(),
      week_of_year: this.getWeekOfYear(startTime),
      month: startTime.getMonth() + 1,
      year: startTime.getFullYear(),
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      cost_usd: totalCost,
      duration_seconds: durationSeconds,
      message_count: messages.length,
      tool_usage_count: Array.from(toolsUsed).length,
      cache_efficiency:
        totalCacheHits + totalCacheMisses > 0
          ? totalCacheHits / (totalCacheHits + totalCacheMisses)
          : 0,
    };

    return {
      session,
      messages: databaseMessages,
      metrics,
    };
  }

  private extractProjectName(filePath: string): string | undefined {
    const pathParts = filePath.split(path.sep);
    const projectsIndex = pathParts.indexOf('projects');

    if (projectsIndex !== -1 && projectsIndex < pathParts.length - 1) {
      return pathParts[projectsIndex + 1];
    }

    return undefined;
  }

  private detectModel(messages: ClaudeCodeMessage[]): string {
    for (const message of messages) {
      if (message.role === 'assistant') {
        return 'claude-3-sonnet-20240229';
      }
    }
    return 'unknown';
  }

  private calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    const costs = {
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
    };

    const modelCosts = costs[model as keyof typeof costs] || costs['claude-3-sonnet-20240229'];

    return (inputTokens / 1000) * modelCosts.input + (outputTokens / 1000) * modelCosts.output;
  }

  private getWeekOfYear(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  async getAllSessionFiles(): Promise<string[]> {
    const sessionFiles: string[] = [];

    if (!fs.existsSync(this.CLAUDE_PROJECTS_PATH)) {
      return sessionFiles;
    }

    const projects = fs
      .readdirSync(this.CLAUDE_PROJECTS_PATH, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const project of projects) {
      const projectPath = path.join(this.CLAUDE_PROJECTS_PATH, project);
      try {
        const files = fs
          .readdirSync(projectPath)
          .filter((file: string) => file.endsWith('.jsonl'))
          .map((file: string) => path.join(projectPath, file));

        sessionFiles.push(...files);
      } catch (error) {
        console.warn(`Warning: Could not read project directory ${project}:`, error);
      }
    }

    return sessionFiles;
  }

  async parseAllSessions(): Promise<{
    successful: ParsedSessionData[];
    failed: Array<{ filePath: string; errors: ParseError[] }>;
  }> {
    const sessionFiles = await this.getAllSessionFiles();
    const successful: ParsedSessionData[] = [];
    const failed: Array<{ filePath: string; errors: ParseError[] }> = [];

    for (const filePath of sessionFiles) {
      const result = await this.parseSessionFile(filePath);

      if (result.success && result.data) {
        successful.push(result.data);
      } else {
        failed.push({ filePath, errors: result.errors });
      }
    }

    return { successful, failed };
  }
}
