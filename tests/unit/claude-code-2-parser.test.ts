import { describe, it, expect, beforeEach } from 'vitest';
import { JSONLParser } from '../../src/parsers/jsonl-parser.js';
import type { ClaudeCodeMessage } from '../../src/types/index.js';

describe('Claude Code 2.0 Parser Tests', () => {
  let parser: JSONLParser;

  beforeEach(() => {
    parser = new JSONLParser();
  });

  describe('Checkpoint Detection', () => {
    it('should detect checkpoint messages', () => {
      const checkpointMessage: ClaudeCodeMessage = {
        role: 'assistant',
        content: 'Creating checkpoint for current state',
        timestamp: '2024-01-01T10:00:00Z',
        tokens: { input: 100, output: 50 },
        checkpoint_id: 'checkpoint_123',
        autonomy_level: 5,
      };

      const result = parser['parseMessage'](checkpointMessage, 1);
      expect(result).toBeTruthy();
      expect(result?.checkpoint_id).toBe('checkpoint_123');
      expect(result?.autonomy_level).toBe(5);
    });

    it('should detect rewind triggers', () => {
      const rewindMessage: ClaudeCodeMessage = {
        role: 'user',
        content: '/rewind to checkpoint_123',
        timestamp: '2024-01-01T10:05:00Z',
        tokens: { input: 50, output: 0 },
        is_rewind_trigger: true,
        checkpoint_id: 'checkpoint_123',
      };

      const result = parser['parseMessage'](rewindMessage, 1);
      expect(result).toBeTruthy();
      expect(result?.is_rewind_trigger).toBe(true);
      expect(result?.checkpoint_id).toBe('checkpoint_123');
    });
  });

  describe('Background Task Detection', () => {
    it('should detect background task messages', () => {
      const backgroundTaskMessage: ClaudeCodeMessage = {
        role: 'background_task',
        content: 'Running long-running code generation task',
        timestamp: '2024-01-01T10:00:00Z',
        tokens: { input: 1000, output: 2000 },
        background_task_id: 'task_456',
        autonomy_level: 8,
      };

      const result = parser['parseMessage'](backgroundTaskMessage, 1);
      expect(result).toBeTruthy();
      expect(result?.role).toBe('background_task');
      expect(result?.background_task_id).toBe('task_456');
      expect(result?.autonomy_level).toBe(8);
    });

    it('should detect different background task types', () => {
      const taskTypes = ['code_generation', 'testing', 'refactoring', 'documentation'];
      
      taskTypes.forEach(taskType => {
        const taskMessage: ClaudeCodeMessage = {
          role: 'background_task',
          content: `Running ${taskType} task`,
          timestamp: '2024-01-01T10:00:00Z',
          tokens: { input: 500, output: 1000 },
          background_task_id: `task_${taskType}_789`,
          autonomy_level: 7,
        };

        const result = parser['parseMessage'](taskMessage, 1);
        expect(result).toBeTruthy();
        expect(result?.background_task_id).toBe(`task_${taskType}_789`);
      });
    });
  });

  describe('Subagent Detection', () => {
    it('should detect subagent messages', () => {
      const subagentMessage: ClaudeCodeMessage = {
        role: 'subagent',
        content: 'Working on frontend component development',
        timestamp: '2024-01-01T10:00:00Z',
        tokens: { input: 800, output: 1200 },
        subagent_id: 'subagent_frontend_001',
        autonomy_level: 6,
      };

      const result = parser['parseMessage'](subagentMessage, 1);
      expect(result).toBeTruthy();
      expect(result?.role).toBe('subagent');
      expect(result?.subagent_id).toBe('subagent_frontend_001');
      expect(result?.autonomy_level).toBe(6);
    });

    it('should detect different subagent types', () => {
      const subagentTypes = ['frontend', 'backend', 'testing', 'documentation', 'review'];
      
      subagentTypes.forEach(agentType => {
        const subagentMessage: ClaudeCodeMessage = {
          role: 'subagent',
          content: `Working on ${agentType} tasks`,
          timestamp: '2024-01-01T10:00:00Z',
          tokens: { input: 600, output: 900 },
          subagent_id: `subagent_${agentType}_002`,
          autonomy_level: 5,
        };

        const result = parser['parseMessage'](subagentMessage, 1);
        expect(result).toBeTruthy();
        expect(result?.subagent_id).toBe(`subagent_${agentType}_002`);
      });
    });
  });

  describe('VS Code Integration Detection', () => {
    it('should detect VS Code integration messages', () => {
      const vscodeMessage: ClaudeCodeMessage = {
        role: 'assistant',
        content: 'Applied changes via VS Code extension',
        timestamp: '2024-01-01T10:00:00Z',
        tokens: { input: 200, output: 300 },
        vscode_integration_id: 'vscode_integration_001',
        autonomy_level: 4,
      };

      const result = parser['parseMessage'](vscodeMessage, 1);
      expect(result).toBeTruthy();
      expect(result?.vscode_integration_id).toBe('vscode_integration_001');
    });
  });

  describe('Extended Session Detection', () => {
    it('should detect extended sessions (30+ hours)', () => {
      const messages: ClaudeCodeMessage[] = [
        {
          role: 'user',
          content: 'Starting extended development session',
          timestamp: '2024-01-01T00:00:00Z',
          tokens: { input: 100, output: 0 },
        },
        {
          role: 'assistant',
          content: 'Beginning autonomous development',
          timestamp: '2024-01-02T06:00:00Z', // 30 hours later
          tokens: { input: 200, output: 500 },
          autonomy_level: 9,
        },
      ];

      const sessionData = parser['buildSessionFromMessages']('test-session.jsonl', messages);
      expect(sessionData.session.is_extended_session).toBe(true);
      expect(sessionData.session.session_type).toBe('autonomous');
      expect(sessionData.session.autonomy_level).toBe(9);
    });

    it('should classify session types correctly', () => {
      // Standard session
      const standardMessages: ClaudeCodeMessage[] = [
        {
          role: 'user',
          content: 'Quick question',
          timestamp: '2024-01-01T10:00:00Z',
          tokens: { input: 50, output: 0 },
        },
        {
          role: 'assistant',
          content: 'Quick answer',
          timestamp: '2024-01-01T10:01:00Z',
          tokens: { input: 100, output: 200 },
        },
      ];

      const standardSession = parser['buildSessionFromMessages']('standard.jsonl', standardMessages);
      expect(standardSession.session.session_type).toBe('standard');
      expect(standardSession.session.is_extended_session).toBe(false);

      // Extended session (30+ hours, low autonomy)
      const extendedMessages: ClaudeCodeMessage[] = [
        {
          role: 'user',
          content: 'Long development session',
          timestamp: '2024-01-01T00:00:00Z',
          tokens: { input: 100, output: 0 },
        },
        {
          role: 'assistant',
          content: 'Working on extended task',
          timestamp: '2024-01-02T06:00:00Z', // 30 hours later
          tokens: { input: 200, output: 500 },
          autonomy_level: 5,
        },
      ];

      const extendedSession = parser['buildSessionFromMessages']('extended.jsonl', extendedMessages);
      expect(extendedSession.session.session_type).toBe('extended');
      expect(extendedSession.session.is_extended_session).toBe(true);

      // Autonomous session (30+ hours, high autonomy)
      const autonomousMessages: ClaudeCodeMessage[] = [
        {
          role: 'user',
          content: 'Autonomous development session',
          timestamp: '2024-01-01T00:00:00Z',
          tokens: { input: 100, output: 0 },
        },
        {
          role: 'assistant',
          content: 'Autonomous development in progress',
          timestamp: '2024-01-02T06:00:00Z', // 30 hours later
          tokens: { input: 200, output: 500 },
          autonomy_level: 9,
        },
      ];

      const autonomousSession = parser['buildSessionFromMessages']('autonomous.jsonl', autonomousMessages);
      expect(autonomousSession.session.session_type).toBe('autonomous');
      expect(autonomousSession.session.is_extended_session).toBe(true);
    });
  });

  describe('Claude Code 2.0 Metrics Calculation', () => {
    it('should calculate enhanced metrics correctly', () => {
      const messages: ClaudeCodeMessage[] = [
        {
          role: 'user',
          content: 'Start session',
          timestamp: '2024-01-01T10:00:00Z',
          tokens: { input: 100, output: 0 },
        },
        {
          role: 'assistant',
          content: 'Creating checkpoint',
          timestamp: '2024-01-01T10:01:00Z',
          tokens: { input: 200, output: 300 },
          checkpoint_id: 'checkpoint_1',
          autonomy_level: 5,
        },
        {
          role: 'subagent',
          content: 'Working on frontend',
          timestamp: '2024-01-01T10:02:00Z',
          tokens: { input: 300, output: 400 },
          subagent_id: 'subagent_1',
          autonomy_level: 6,
        },
        {
          role: 'background_task',
          content: 'Running background task',
          timestamp: '2024-01-01T10:03:00Z',
          tokens: { input: 400, output: 500 },
          background_task_id: 'task_1',
          autonomy_level: 8,
        },
        {
          role: 'assistant',
          content: 'VS Code integration',
          timestamp: '2024-01-01T10:04:00Z',
          tokens: { input: 150, output: 200 },
          vscode_integration_id: 'vscode_1',
          autonomy_level: 4,
        },
        {
          role: 'user',
          content: '/rewind',
          timestamp: '2024-01-01T10:05:00Z',
          tokens: { input: 50, output: 0 },
          is_rewind_trigger: true,
          checkpoint_id: 'checkpoint_1',
        },
      ];

      const sessionData = parser['buildSessionFromMessages']('enhanced-session.jsonl', messages);
      
      // Check session features
      expect(sessionData.session.has_background_tasks).toBe(true);
      expect(sessionData.session.has_subagents).toBe(true);
      expect(sessionData.session.has_vscode_integration).toBe(true);
      expect(sessionData.session.autonomy_level).toBe(8); // Max autonomy level

      // Check enhanced metrics
      expect(sessionData.metrics.checkpoint_count).toBe(1);
      expect(sessionData.metrics.rewind_count).toBe(1);
      expect(sessionData.metrics.background_task_count).toBe(1);
      expect(sessionData.metrics.subagent_count).toBe(1);
      expect(sessionData.metrics.vscode_integration_count).toBe(1);
      expect(sessionData.metrics.autonomy_score).toBe(5.5); // Average autonomy level
      expect(sessionData.metrics.parallel_development_efficiency).toBeGreaterThan(0);
    });
  });

  describe('Error Handling for Claude Code 2.0', () => {
    it('should handle malformed checkpoint data gracefully', () => {
      const malformedData = {
        role: 'assistant',
        content: 'Checkpoint message',
        timestamp: '2024-01-01T10:00:00Z',
        checkpoint_id: null, // Invalid checkpoint ID
        autonomy_level: 'invalid', // Invalid autonomy level
      };

      const result = parser['parseMessage'](malformedData, 1);
      expect(result).toBeTruthy();
      expect(result?.checkpoint_id).toBeUndefined();
      expect(result?.autonomy_level).toBe(0); // Should default to 0
    });

    it('should handle missing Claude Code 2.0 fields gracefully', () => {
      const legacyMessage = {
        role: 'assistant',
        content: 'Legacy message format',
        timestamp: '2024-01-01T10:00:00Z',
        tokens: { input: 100, output: 200 },
      };

      const result = parser['parseMessage'](legacyMessage, 1);
      expect(result).toBeTruthy();
      expect(result?.checkpoint_id).toBeUndefined();
      expect(result?.subagent_id).toBeUndefined();
      expect(result?.background_task_id).toBeUndefined();
      expect(result?.vscode_integration_id).toBeUndefined();
      expect(result?.is_rewind_trigger).toBe(false);
      expect(result?.autonomy_level).toBe(0);
    });
  });

  describe('Performance with Claude Code 2.0 Features', () => {
    it('should handle large extended sessions efficiently', () => {
      const startTime = Date.now();
      
      // Create a large extended session (1000 messages over 30+ hours)
      const messages: ClaudeCodeMessage[] = [];
      const startDate = new Date('2024-01-01T00:00:00Z');
      
      for (let i = 0; i < 1000; i++) {
        const messageDate = new Date(startDate.getTime() + (i * 2 * 60 * 1000)); // 2 minutes apart
        messages.push({
          role: i % 4 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: messageDate.toISOString(),
          tokens: { input: 100, output: 200 },
          autonomy_level: Math.floor(Math.random() * 10),
          checkpoint_id: i % 50 === 0 ? `checkpoint_${i}` : undefined,
          subagent_id: i % 100 === 0 ? `subagent_${i}` : undefined,
          background_task_id: i % 200 === 0 ? `task_${i}` : undefined,
        });
      }

      const sessionData = parser['buildSessionFromMessages']('large-session.jsonl', messages);
      const endTime = Date.now();
      
      expect(sessionData.session.is_extended_session).toBe(true);
      expect(sessionData.session.session_type).toBe('autonomous');
      expect(sessionData.metrics.checkpoint_count).toBe(20); // Every 50th message
      expect(sessionData.metrics.subagent_count).toBe(10); // Every 100th message
      expect(sessionData.metrics.background_task_count).toBe(5); // Every 200th message
      
      // Should process in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
