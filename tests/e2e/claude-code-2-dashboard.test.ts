import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

describe('Claude Code 2.0 Dashboard E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  const baseUrl = 'http://localhost:5173';

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Dashboard Overview with Claude Code 2.0 Features', () => {
    it('should display Claude Code 2.0 metrics on the main dashboard', async () => {
      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');

      // Check for Claude Code 2.0 specific widgets
      await expect(page.locator('[data-testid="extended-sessions-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="autonomous-sessions-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="checkpoints-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="subagents-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="background-tasks-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="vscode-integrations-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="autonomy-level-widget"]')).toBeVisible();
    });

    it('should display enhanced session metrics', async () => {
      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');

      // Check for enhanced metrics display
      const extendedSessions = page.locator('[data-testid="extended-sessions-count"]');
      const autonomousSessions = page.locator('[data-testid="autonomous-sessions-count"]');
      const totalCheckpoints = page.locator('[data-testid="total-checkpoints"]');
      const totalRewinds = page.locator('[data-testid="total-rewinds"]');
      const totalSubagents = page.locator('[data-testid="total-subagents"]');
      const averageAutonomy = page.locator('[data-testid="average-autonomy-level"]');

      await expect(extendedSessions).toBeVisible();
      await expect(autonomousSessions).toBeVisible();
      await expect(totalCheckpoints).toBeVisible();
      await expect(totalRewinds).toBeVisible();
      await expect(totalSubagents).toBeVisible();
      await expect(averageAutonomy).toBeVisible();

      // Verify metrics contain numeric values
      const extendedCount = await extendedSessions.textContent();
      const autonomousCount = await autonomousSessions.textContent();
      const checkpointCount = await totalCheckpoints.textContent();
      const rewindCount = await totalRewinds.textContent();
      const subagentCount = await totalSubagents.textContent();
      const autonomyLevel = await averageAutonomy.textContent();

      expect(extendedCount).toMatch(/^\d+$/);
      expect(autonomousCount).toMatch(/^\d+$/);
      expect(checkpointCount).toMatch(/^\d+$/);
      expect(rewindCount).toMatch(/^\d+$/);
      expect(subagentCount).toMatch(/^\d+$/);
      expect(autonomyLevel).toMatch(/^\d+(\.\d+)?$/);
    });
  });

  describe('Enhanced Session Filtering', () => {
    it('should filter sessions by Claude Code 2.0 features', async () => {
      await page.goto(`${baseUrl}/sessions`);
      await page.waitForLoadState('networkidle');

      // Test extended session filter
      await page.click('[data-testid="filter-extended-sessions"]');
      await page.waitForTimeout(1000);
      
      const sessionCards = page.locator('[data-testid="session-card"]');
      const sessionCount = await sessionCards.count();
      
      if (sessionCount > 0) {
        // All visible sessions should be extended
        for (let i = 0; i < sessionCount; i++) {
          const sessionCard = sessionCards.nth(i);
          const sessionType = await sessionCard.locator('[data-testid="session-type"]').textContent();
          expect(sessionType).toBe('extended');
        }
      }

      // Test autonomous session filter
      await page.click('[data-testid="filter-autonomous-sessions"]');
      await page.waitForTimeout(1000);
      
      const autonomousSessions = page.locator('[data-testid="session-card"]');
      const autonomousCount = await autonomousSessions.count();
      
      if (autonomousCount > 0) {
        for (let i = 0; i < autonomousCount; i++) {
          const sessionCard = autonomousSessions.nth(i);
          const sessionType = await sessionCard.locator('[data-testid="session-type"]').textContent();
          expect(sessionType).toBe('autonomous');
        }
      }
    });

    it('should filter sessions by autonomy level', async () => {
      await page.goto(`${baseUrl}/sessions`);
      await page.waitForLoadState('networkidle');

      // Set minimum autonomy level filter
      await page.fill('[data-testid="min-autonomy-level"]', '7');
      await page.click('[data-testid="apply-filters"]');
      await page.waitForTimeout(1000);

      const sessionCards = page.locator('[data-testid="session-card"]');
      const sessionCount = await sessionCards.count();
      
      if (sessionCount > 0) {
        for (let i = 0; i < sessionCount; i++) {
          const sessionCard = sessionCards.nth(i);
          const autonomyLevel = await sessionCard.locator('[data-testid="autonomy-level"]').textContent();
          const level = parseInt(autonomyLevel || '0');
          expect(level).toBeGreaterThanOrEqual(7);
        }
      }
    });

    it('should filter sessions by Claude Code 2.0 features', async () => {
      await page.goto(`${baseUrl}/sessions`);
      await page.waitForLoadState('networkidle');

      // Filter by sessions with checkpoints
      await page.click('[data-testid="filter-has-checkpoints"]');
      await page.waitForTimeout(1000);

      const sessionCards = page.locator('[data-testid="session-card"]');
      const sessionCount = await sessionCards.count();
      
      if (sessionCount > 0) {
        for (let i = 0; i < sessionCount; i++) {
          const sessionCard = sessionCards.nth(i);
          const hasCheckpoints = await sessionCard.locator('[data-testid="has-checkpoints"]').textContent();
          expect(hasCheckpoints).toBe('Yes');
        }
      }

      // Filter by sessions with subagents
      await page.click('[data-testid="filter-has-subagents"]');
      await page.waitForTimeout(1000);

      const subagentSessions = page.locator('[data-testid="session-card"]');
      const subagentCount = await subagentSessions.count();
      
      if (subagentCount > 0) {
        for (let i = 0; i < subagentCount; i++) {
          const sessionCard = subagentSessions.nth(i);
          const hasSubagents = await sessionCard.locator('[data-testid="has-subagents"]').textContent();
          expect(hasSubagents).toBe('Yes');
        }
      }
    });
  });

  describe('Enhanced Session Details', () => {
    it('should display Claude Code 2.0 features in session details', async () => {
      await page.goto(`${baseUrl}/sessions`);
      await page.waitForLoadState('networkidle');

      // Click on first session
      const firstSession = page.locator('[data-testid="session-card"]').first();
      await firstSession.click();
      await page.waitForLoadState('networkidle');

      // Check for Claude Code 2.0 features in session details
      await expect(page.locator('[data-testid="session-type-badge"]')).toBeVisible();
      await expect(page.locator('[data-testid="autonomy-level-display"]')).toBeVisible();
      await expect(page.locator('[data-testid="extended-session-indicator"]')).toBeVisible();
      
      // Check for feature indicators
      const hasCheckpoints = page.locator('[data-testid="has-checkpoints-indicator"]');
      const hasSubagents = page.locator('[data-testid="has-subagents-indicator"]');
      const hasBackgroundTasks = page.locator('[data-testid="has-background-tasks-indicator"]');
      const hasVSCodeIntegration = page.locator('[data-testid="has-vscode-integration-indicator"]');

      await expect(hasCheckpoints).toBeVisible();
      await expect(hasSubagents).toBeVisible();
      await expect(hasBackgroundTasks).toBeVisible();
      await expect(hasVSCodeIntegration).toBeVisible();
    });

    it('should display checkpoint timeline', async () => {
      await page.goto(`${baseUrl}/sessions`);
      await page.waitForLoadState('networkidle');

      // Find a session with checkpoints
      const sessionWithCheckpoints = page.locator('[data-testid="session-card"]').filter({ hasText: 'Checkpoints' }).first();
      if (await sessionWithCheckpoints.count() > 0) {
        await sessionWithCheckpoints.click();
        await page.waitForLoadState('networkidle');

        // Check for checkpoint timeline
        await expect(page.locator('[data-testid="checkpoint-timeline"]')).toBeVisible();
        await expect(page.locator('[data-testid="checkpoint-item"]')).toHaveCount.greaterThan(0);

        // Check checkpoint details
        const firstCheckpoint = page.locator('[data-testid="checkpoint-item"]').first();
        await expect(firstCheckpoint.locator('[data-testid="checkpoint-id"]')).toBeVisible();
        await expect(firstCheckpoint.locator('[data-testid="checkpoint-timestamp"]')).toBeVisible();
        await expect(firstCheckpoint.locator('[data-testid="rewind-count"]')).toBeVisible();
      }
    });

    it('should display subagent performance', async () => {
      await page.goto(`${baseUrl}/sessions`);
      await page.waitForLoadState('networkidle');

      // Find a session with subagents
      const sessionWithSubagents = page.locator('[data-testid="session-card"]').filter({ hasText: 'Subagents' }).first();
      if (await sessionWithSubagents.count() > 0) {
        await sessionWithSubagents.click();
        await page.waitForLoadState('networkidle');

        // Check for subagent performance section
        await expect(page.locator('[data-testid="subagent-performance"]')).toBeVisible();
        await expect(page.locator('[data-testid="subagent-item"]')).toHaveCount.greaterThan(0);

        // Check subagent details
        const firstSubagent = page.locator('[data-testid="subagent-item"]').first();
        await expect(firstSubagent.locator('[data-testid="subagent-type"]')).toBeVisible();
        await expect(firstSubagent.locator('[data-testid="subagent-efficiency"]')).toBeVisible();
        await expect(firstSubagent.locator('[data-testid="tasks-completed"]')).toBeVisible();
      }
    });

    it('should display background task progress', async () => {
      await page.goto(`${baseUrl}/sessions`);
      await page.waitForLoadState('networkidle');

      // Find a session with background tasks
      const sessionWithTasks = page.locator('[data-testid="session-card"]').filter({ hasText: 'Background Tasks' }).first();
      if (await sessionWithTasks.count() > 0) {
        await sessionWithTasks.click();
        await page.waitForLoadState('networkidle');

        // Check for background task section
        await expect(page.locator('[data-testid="background-tasks-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="background-task-item"]')).toHaveCount.greaterThan(0);

        // Check background task details
        const firstTask = page.locator('[data-testid="background-task-item"]').first();
        await expect(firstTask.locator('[data-testid="task-type"]')).toBeVisible();
        await expect(firstTask.locator('[data-testid="task-progress"]')).toBeVisible();
        await expect(firstTask.locator('[data-testid="task-status"]')).toBeVisible();
      }
    });
  });

  describe('Enhanced Analytics Charts', () => {
    it('should display Claude Code 2.0 analytics charts', async () => {
      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');

      // Check for enhanced analytics charts
      await expect(page.locator('[data-testid="autonomy-level-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="checkpoint-usage-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="subagent-efficiency-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="background-task-duration-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="vscode-integration-chart"]')).toBeVisible();
    });

    it('should display session type distribution', async () => {
      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');

      // Check for session type distribution chart
      const sessionTypeChart = page.locator('[data-testid="session-type-distribution-chart"]');
      await expect(sessionTypeChart).toBeVisible();

      // Verify chart contains expected session types
      const chartLegend = sessionTypeChart.locator('[data-testid="chart-legend"]');
      await expect(chartLegend.locator('text:has-text("Standard")')).toBeVisible();
      await expect(chartLegend.locator('text:has-text("Extended")')).toBeVisible();
      await expect(chartLegend.locator('text:has-text("Autonomous")')).toBeVisible();
    });

    it('should display checkpoint efficiency over time', async () => {
      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');

      // Check for checkpoint efficiency chart
      const checkpointChart = page.locator('[data-testid="checkpoint-efficiency-chart"]');
      await expect(checkpointChart).toBeVisible();

      // Verify chart is interactive
      await checkpointChart.hover();
      await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible();
    });

    it('should display subagent performance comparison', async () => {
      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');

      // Check for subagent performance chart
      const subagentChart = page.locator('[data-testid="subagent-performance-chart"]');
      await expect(subagentChart).toBeVisible();

      // Verify chart shows different subagent types
      const chartBars = subagentChart.locator('[data-testid="chart-bar"]');
      await expect(chartBars).toHaveCount.greaterThan(0);
    });
  });

  describe('Enhanced Dashboard Customization', () => {
    it('should allow adding Claude Code 2.0 widgets', async () => {
      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');

      // Enter dashboard edit mode
      await page.click('[data-testid="edit-dashboard-button"]');
      await page.waitForTimeout(500);

      // Check for Claude Code 2.0 widget options
      await expect(page.locator('[data-testid="widget-checkpoints"]')).toBeVisible();
      await expect(page.locator('[data-testid="widget-subagents"]')).toBeVisible();
      await expect(page.locator('[data-testid="widget-background-tasks"]')).toBeVisible();
      await expect(page.locator('[data-testid="widget-vscode-integrations"]')).toBeVisible();
      await expect(page.locator('[data-testid="widget-autonomy-level"]')).toBeVisible();
      await expect(page.locator('[data-testid="widget-extended-sessions"]')).toBeVisible();

      // Add a checkpoint widget
      await page.click('[data-testid="widget-checkpoints"]');
      await page.waitForTimeout(500);

      // Verify widget was added
      await expect(page.locator('[data-testid="checkpoints-widget"]')).toBeVisible();

      // Save dashboard
      await page.click('[data-testid="save-dashboard-button"]');
      await page.waitForTimeout(1000);

      // Verify widget persists after save
      await expect(page.locator('[data-testid="checkpoints-widget"]')).toBeVisible();
    });

    it('should allow configuring Claude Code 2.0 widget settings', async () => {
      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');

      // Enter dashboard edit mode
      await page.click('[data-testid="edit-dashboard-button"]');
      await page.waitForTimeout(500);

      // Configure checkpoint widget
      const checkpointWidget = page.locator('[data-testid="checkpoints-widget"]');
      await checkpointWidget.click();
      await page.waitForTimeout(500);

      // Open widget settings
      await page.click('[data-testid="widget-settings-button"]');
      await page.waitForTimeout(500);

      // Configure widget settings
      await page.selectOption('[data-testid="checkpoint-time-range"]', '30d');
      await page.check('[data-testid="show-rewind-rate"]');
      await page.check('[data-testid="show-efficiency-metrics"]');

      // Save widget settings
      await page.click('[data-testid="save-widget-settings"]');
      await page.waitForTimeout(500);

      // Verify settings were applied
      await expect(page.locator('[data-testid="rewind-rate-display"]')).toBeVisible();
      await expect(page.locator('[data-testid="efficiency-metrics-display"]')).toBeVisible();
    });
  });

  describe('Performance with Claude Code 2.0 Features', () => {
    it('should load dashboard quickly with Claude Code 2.0 features', async () => {
      const startTime = Date.now();
      
      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Dashboard should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    it('should handle large datasets with Claude Code 2.0 features efficiently', async () => {
      await page.goto(`${baseUrl}/sessions`);
      await page.waitForLoadState('networkidle');

      // Set date range to 90 days to test with larger dataset
      await page.selectOption('[data-testid="date-range-selector"]', '90d');
      await page.waitForTimeout(2000);

      // Verify sessions are loaded efficiently
      const sessionCards = page.locator('[data-testid="session-card"]');
      await expect(sessionCards).toHaveCount.greaterThan(0);

      // Check that Claude Code 2.0 features are displayed without performance issues
      const firstSession = sessionCards.first();
      await expect(firstSession.locator('[data-testid="session-type-badge"]')).toBeVisible();
      await expect(firstSession.locator('[data-testid="autonomy-level"]')).toBeVisible();
    });

    it('should handle extended session details efficiently', async () => {
      await page.goto(`${baseUrl}/sessions`);
      await page.waitForLoadState('networkidle');

      // Filter for extended sessions
      await page.click('[data-testid="filter-extended-sessions"]');
      await page.waitForTimeout(1000);

      // Click on first extended session
      const firstExtendedSession = page.locator('[data-testid="session-card"]').first();
      await firstExtendedSession.click();
      await page.waitForLoadState('networkidle');

      // Verify extended session details load efficiently
      await expect(page.locator('[data-testid="extended-session-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="autonomy-timeline"]')).toBeVisible();
      await expect(page.locator('[data-testid="feature-usage-timeline"]')).toBeVisible();
    });
  });

  describe('Error Handling for Claude Code 2.0 Features', () => {
    it('should handle missing Claude Code 2.0 data gracefully', async () => {
      // Navigate to a session that might not have Claude Code 2.0 features
      await page.goto(`${baseUrl}/sessions`);
      await page.waitForLoadState('networkidle');

      // Find a standard session (not extended or autonomous)
      const standardSession = page.locator('[data-testid="session-card"]').filter({ hasText: 'Standard' }).first();
      if (await standardSession.count() > 0) {
        await standardSession.click();
        await page.waitForLoadState('networkidle');

        // Verify that missing Claude Code 2.0 features are handled gracefully
        await expect(page.locator('[data-testid="no-checkpoints-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="no-subagents-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="no-background-tasks-message"]')).toBeVisible();
      }
    });

    it('should handle API errors for Claude Code 2.0 features gracefully', async () => {
      // Mock API error for Claude Code 2.0 endpoints
      await page.route('**/api/analytics/checkpoints', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');

      // Verify error is handled gracefully
      await expect(page.locator('[data-testid="checkpoints-error-message"]')).toBeVisible();
    });
  });
});
