import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app.js';

describe('Claude Code 2.0 API Integration Tests', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Enhanced Analytics Endpoints', () => {
    it('should return Claude Code 2.0 session metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/overview',
        query: {
          dateRange: '30d'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      // Should include Claude Code 2.0 metrics
      expect(data).toHaveProperty('totalSessions');
      expect(data).toHaveProperty('totalCost');
      expect(data).toHaveProperty('totalTokens');
      expect(data).toHaveProperty('averageSessionDuration');
      
      // Claude Code 2.0 specific metrics
      expect(data).toHaveProperty('extendedSessions');
      expect(data).toHaveProperty('autonomousSessions');
      expect(data).toHaveProperty('totalCheckpoints');
      expect(data).toHaveProperty('totalRewinds');
      expect(data).toHaveProperty('totalBackgroundTasks');
      expect(data).toHaveProperty('totalSubagents');
      expect(data).toHaveProperty('vscodeIntegrations');
      expect(data).toHaveProperty('averageAutonomyLevel');
      expect(data).toHaveProperty('parallelDevelopmentEfficiency');
    });

    it('should filter sessions by Claude Code 2.0 features', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/sessions',
        query: {
          sessionType: 'extended',
          hasBackgroundTasks: 'true',
          hasSubagents: 'true',
          minAutonomyLevel: '5'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('pageSize');
      
      // All returned sessions should match filters
      if (data.sessions.length > 0) {
        data.sessions.forEach((session: any) => {
          expect(session.session_type).toBe('extended');
          expect(session.has_background_tasks).toBe(true);
          expect(session.has_subagents).toBe(true);
          expect(session.autonomy_level).toBeGreaterThanOrEqual(5);
        });
      }
    });

    it('should return checkpoint analytics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/checkpoints',
        query: {
          dateRange: '7d'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data).toHaveProperty('totalCheckpoints');
      expect(data).toHaveProperty('totalRewinds');
      expect(data).toHaveProperty('rewindRate');
      expect(data).toHaveProperty('checkpointFrequency');
      expect(data).toHaveProperty('averageCheckpointsPerSession');
      expect(data).toHaveProperty('mostUsedCheckpoints');
      expect(data).toHaveProperty('checkpointEfficiency');
    });

    it('should return subagent analytics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/subagents',
        query: {
          dateRange: '30d'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data).toHaveProperty('totalSubagents');
      expect(data).toHaveProperty('subagentTypes');
      expect(data).toHaveProperty('averageEfficiency');
      expect(data).toHaveProperty('parallelDevelopmentSessions');
      expect(data).toHaveProperty('subagentPerformance');
      expect(data).toHaveProperty('taskCompletionRates');
    });

    it('should return background task analytics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/background-tasks',
        query: {
          dateRange: '14d'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data).toHaveProperty('totalTasks');
      expect(data).toHaveProperty('taskTypes');
      expect(data).toHaveProperty('averageDuration');
      expect(data).toHaveProperty('completionRate');
      expect(data).toHaveProperty('efficiencyMetrics');
      expect(data).toHaveProperty('longRunningTasks');
    });

    it('should return VS Code integration analytics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/vscode-integrations',
        query: {
          dateRange: '7d'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data).toHaveProperty('totalIntegrations');
      expect(data).toHaveProperty('averageDuration');
      expect(data).toHaveProperty('featuresUsed');
      expect(data).toHaveProperty('fileOperations');
      expect(data).toHaveProperty('diffViews');
      expect(data).toHaveProperty('inlineSuggestions');
      expect(data).toHaveProperty('sidebarInteractions');
    });
  });

  describe('Enhanced Session Details', () => {
    it('should return detailed session with Claude Code 2.0 features', async () => {
      // First, get a list of sessions
      const sessionsResponse = await app.inject({
        method: 'GET',
        url: '/api/analytics/sessions',
        query: { limit: '1' }
      });

      expect(sessionsResponse.statusCode).toBe(200);
      const sessionsData = sessionsResponse.json();
      
      if (sessionsData.sessions.length > 0) {
        const sessionId = sessionsData.sessions[0].id;
        
        const response = await app.inject({
          method: 'GET',
          url: `/api/analytics/sessions/${sessionId}`
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        
        // Basic session data
        expect(data).toHaveProperty('session');
        expect(data).toHaveProperty('messages');
        expect(data).toHaveProperty('metrics');
        
        // Claude Code 2.0 enhanced session data
        expect(data.session).toHaveProperty('is_extended_session');
        expect(data.session).toHaveProperty('has_background_tasks');
        expect(data.session).toHaveProperty('has_subagents');
        expect(data.session).toHaveProperty('has_vscode_integration');
        expect(data.session).toHaveProperty('session_type');
        expect(data.session).toHaveProperty('autonomy_level');
        
        // Enhanced metrics
        expect(data.metrics).toHaveProperty('checkpoint_count');
        expect(data.metrics).toHaveProperty('rewind_count');
        expect(data.metrics).toHaveProperty('background_task_count');
        expect(data.metrics).toHaveProperty('subagent_count');
        expect(data.metrics).toHaveProperty('vscode_integration_count');
        expect(data.metrics).toHaveProperty('autonomy_score');
        expect(data.metrics).toHaveProperty('parallel_development_efficiency');
      }
    });

    it('should return session checkpoints', async () => {
      const sessionsResponse = await app.inject({
        method: 'GET',
        url: '/api/analytics/sessions',
        query: { hasCheckpoints: 'true', limit: '1' }
      });

      expect(sessionsResponse.statusCode).toBe(200);
      const sessionsData = sessionsResponse.json();
      
      if (sessionsData.sessions.length > 0) {
        const sessionId = sessionsData.sessions[0].id;
        
        const response = await app.inject({
          method: 'GET',
          url: `/api/analytics/sessions/${sessionId}/checkpoints`
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        
        expect(data).toHaveProperty('checkpoints');
        expect(data).toHaveProperty('totalCount');
        
        if (data.checkpoints.length > 0) {
          const checkpoint = data.checkpoints[0];
          expect(checkpoint).toHaveProperty('checkpoint_id');
          expect(checkpoint).toHaveProperty('created_at');
          expect(checkpoint).toHaveProperty('is_rewind_point');
          expect(checkpoint).toHaveProperty('rewind_count');
          expect(checkpoint).toHaveProperty('tokens_used');
          expect(checkpoint).toHaveProperty('cost_usd');
        }
      }
    });

    it('should return session subagents', async () => {
      const sessionsResponse = await app.inject({
        method: 'GET',
        url: '/api/analytics/sessions',
        query: { hasSubagents: 'true', limit: '1' }
      });

      expect(sessionsResponse.statusCode).toBe(200);
      const sessionsData = sessionsResponse.json();
      
      if (sessionsData.sessions.length > 0) {
        const sessionId = sessionsData.sessions[0].id;
        
        const response = await app.inject({
          method: 'GET',
          url: `/api/analytics/sessions/${sessionId}/subagents`
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        
        expect(data).toHaveProperty('subagents');
        expect(data).toHaveProperty('totalCount');
        
        if (data.subagents.length > 0) {
          const subagent = data.subagents[0];
          expect(subagent).toHaveProperty('subagent_id');
          expect(subagent).toHaveProperty('subagent_type');
          expect(subagent).toHaveProperty('status');
          expect(subagent).toHaveProperty('tasks_assigned');
          expect(subagent).toHaveProperty('tasks_completed');
          expect(subagent).toHaveProperty('efficiency_score');
        }
      }
    });

    it('should return session background tasks', async () => {
      const sessionsResponse = await app.inject({
        method: 'GET',
        url: '/api/analytics/sessions',
        query: { hasBackgroundTasks: 'true', limit: '1' }
      });

      expect(sessionsResponse.statusCode).toBe(200);
      const sessionsData = sessionsResponse.json();
      
      if (sessionsData.sessions.length > 0) {
        const sessionId = sessionsData.sessions[0].id;
        
        const response = await app.inject({
          method: 'GET',
          url: `/api/analytics/sessions/${sessionId}/background-tasks`
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        
        expect(data).toHaveProperty('backgroundTasks');
        expect(data).toHaveProperty('totalCount');
        
        if (data.backgroundTasks.length > 0) {
          const task = data.backgroundTasks[0];
          expect(task).toHaveProperty('task_id');
          expect(task).toHaveProperty('task_type');
          expect(task).toHaveProperty('status');
          expect(task).toHaveProperty('progress_percentage');
          expect(task).toHaveProperty('duration_seconds');
        }
      }
    });
  });

  describe('Enhanced Data Sync', () => {
    it('should sync Claude Code 2.0 data successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sync/run',
        payload: {
          includeClaudeCode2Features: true,
          extendedSessionThreshold: 108000, // 30 hours
          autonomyLevelThreshold: 7
        }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('filesProcessed');
      expect(data).toHaveProperty('sessionsProcessed');
      expect(data).toHaveProperty('checkpointsProcessed');
      expect(data).toHaveProperty('backgroundTasksProcessed');
      expect(data).toHaveProperty('subagentsProcessed');
      expect(data).toHaveProperty('vscodeIntegrationsProcessed');
      expect(data).toHaveProperty('extendedSessionsDetected');
      expect(data).toHaveProperty('autonomousSessionsDetected');
    });

    it('should return enhanced sync status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/sync/status'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data).toHaveProperty('lastSync');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('totalFiles');
      expect(data).toHaveProperty('totalSessions');
      
      // Claude Code 2.0 sync status
      expect(data).toHaveProperty('totalCheckpoints');
      expect(data).toHaveProperty('totalBackgroundTasks');
      expect(data).toHaveProperty('totalSubagents');
      expect(data).toHaveProperty('totalVSCodeIntegrations');
      expect(data).toHaveProperty('extendedSessionsCount');
      expect(data).toHaveProperty('autonomousSessionsCount');
    });
  });

  describe('Enhanced Data Quality', () => {
    it('should return Claude Code 2.0 data quality metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/data-quality/overview'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data).toHaveProperty('overallScore');
      expect(data).toHaveProperty('totalSessions');
      expect(data).toHaveProperty('duplicateSessions');
      expect(data).toHaveProperty('missingData');
      
      // Claude Code 2.0 data quality metrics
      expect(data).toHaveProperty('checkpointDataQuality');
      expect(data).toHaveProperty('backgroundTaskDataQuality');
      expect(data).toHaveProperty('subagentDataQuality');
      expect(data).toHaveProperty('vscodeIntegrationDataQuality');
      expect(data).toHaveProperty('extendedSessionDataQuality');
      expect(data).toHaveProperty('autonomyLevelConsistency');
    });
  });

  describe('Error Handling for Claude Code 2.0', () => {
    it('should handle invalid session type filters gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/sessions',
        query: {
          sessionType: 'invalid_type'
        }
      });

      expect(response.statusCode).toBe(400);
      const data = response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid session type');
    });

    it('should handle invalid autonomy level filters gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/sessions',
        query: {
          minAutonomyLevel: 'invalid'
        }
      });

      expect(response.statusCode).toBe(400);
      const data = response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid autonomy level');
    });

    it('should handle missing Claude Code 2.0 endpoints gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/nonexistent-endpoint'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Performance with Claude Code 2.0 Features', () => {
    it('should handle large extended sessions efficiently', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/sessions',
        query: {
          sessionType: 'extended',
          limit: '100'
        }
      });

      const endTime = Date.now();
      
      expect(response.statusCode).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // Should respond within 2 seconds
      
      const data = response.json();
      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('totalCount');
    });

    it('should handle complex analytics queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/overview',
        query: {
          dateRange: '90d',
          includeClaudeCode2Features: 'true'
        }
      });

      const endTime = Date.now();
      
      expect(response.statusCode).toBe(200);
      expect(endTime - startTime).toBeLessThan(3000); // Should respond within 3 seconds
      
      const data = response.json();
      expect(data).toHaveProperty('extendedSessions');
      expect(data).toHaveProperty('autonomousSessions');
      expect(data).toHaveProperty('totalCheckpoints');
      expect(data).toHaveProperty('totalSubagents');
    });
  });
});
