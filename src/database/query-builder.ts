import { DatabaseConnection } from './connection.js';

export interface AnalyticsFilters {
  dateFrom?: Date;
  dateTo?: Date;
  projectName?: string;
  modelName?: string;
  sessionIds?: string[];
  limit?: number;
  offset?: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  count?: number;
}

export interface SessionSummary {
  session_id: string;
  project_name?: string;
  started_at: Date;
  duration_seconds?: number;
  total_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
  model_name?: string;
  tools_used: string[];
}

export interface UsageMetrics {
  totalSessions: number;
  sessionsThisMonth: number;
  sessionsThisWeek: number;
  totalCost: number;
  costThisMonth: number;
  costThisWeek: number;
  totalInputTokens: number;
  inputTokensThisMonth: number;
  totalOutputTokens: number;
  outputTokensThisMonth: number;
  averageSessionDuration: number;
  avgDurationThisMonth: number;
  topModels: Array<{ model: string; count: number; percentage: number }>;
  topProjects: Array<{ project: string; count: number; percentage: number }>;
  topTools: Array<{ tool: string; count: number; percentage: number }>;
}

export interface CostAnalysis {
  dailyCosts: TimeSeriesPoint[];
  weeklyCosts: TimeSeriesPoint[];
  monthlyCosts: TimeSeriesPoint[];
  costByModel: Array<{ model: string; cost: number; percentage: number }>;
  costByProject: Array<{ project: string; cost: number; percentage: number }>;
  mostExpensiveSessions: SessionSummary[];
}

export interface TokenAnalysis {
  dailyTokens: { input: TimeSeriesPoint[]; output: TimeSeriesPoint[] };
  weeklyTokens: { input: TimeSeriesPoint[]; output: TimeSeriesPoint[] };
  monthlyTokens: { input: TimeSeriesPoint[]; output: TimeSeriesPoint[] };
  tokensByModel: Array<{ model: string; input_tokens: number; output_tokens: number }>;
  tokenEfficiency: Array<{
    date: string;
    input_tokens: number;
    output_tokens: number;
    efficiency_ratio: number;
  }>;
}

export interface TrendAnalysis {
  weekOverWeekGrowth: {
    sessions: { current: number; previous: number; growth: number };
    cost: { current: number; previous: number; growth: number };
    tokens: { current: number; previous: number; growth: number };
  };
  monthOverMonthGrowth: {
    sessions: { current: number; previous: number; growth: number };
    cost: { current: number; previous: number; growth: number };
    tokens: { current: number; previous: number; growth: number };
  };
  seasonalPatterns: Array<{
    month: string;
    sessions: number;
    cost: number;
    tokens: number;
  }>;
  anomalyDetection: Array<{
    date: string;
    type: 'sessions' | 'cost' | 'tokens';
    value: number;
    expectedValue: number;
    deviation: number;
  }>;
}

export interface CostOptimizationInsights {
  mostExpensiveSessions: Array<SessionSummary & { efficiency: number }>;
  costPerOutcomeAnalysis: Array<{
    model: string;
    avgCostPerSession: number;
    avgTokensPerSession: number;
    efficiency: number;
  }>;
  modelEfficiencyRecommendations: Array<{
    currentModel: string;
    recommendedModel: string;
    potentialSavings: number;
    reason: string;
  }>;
  budgetTracking: {
    currentMonthSpend: number;
    projectedMonthSpend: number;
    budgetLimit: number;
    budgetUtilization: number;
    daysRemaining: number;
  };
}

export class AnalyticsQueryBuilder {
  private db: DatabaseConnection;

  constructor(db?: DatabaseConnection) {
    this.db = db || DatabaseConnection.getInstance();
  }

  private buildWhereClause(filters: AnalyticsFilters): { whereClause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.dateFrom) {
      conditions.push(`s.started_at >= $${paramIndex}`);
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      conditions.push(`s.started_at <= $${paramIndex}`);
      params.push(filters.dateTo);
      paramIndex++;
    }

    if (filters.projectName) {
      conditions.push(`s.project_name = $${paramIndex}`);
      params.push(filters.projectName);
      paramIndex++;
    }

    if (filters.modelName) {
      conditions.push(`s.model_name = $${paramIndex}`);
      params.push(filters.modelName);
      paramIndex++;
    }

    if (filters.sessionIds && filters.sessionIds.length > 0) {
      conditions.push(`s.session_id = ANY($${paramIndex})`);
      params.push(filters.sessionIds);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return { whereClause, params };
  }

  async getUsageMetrics(filters: AnalyticsFilters = {}): Promise<UsageMetrics> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const metricsQuery = `
      WITH session_stats AS (
        SELECT
          COUNT(*) as total_sessions,
          COUNT(*) FILTER (WHERE s.started_at >= DATE_TRUNC('month', CURRENT_DATE)) as sessions_this_month,
          COUNT(*) FILTER (WHERE s.started_at >= DATE_TRUNC('week', CURRENT_DATE)) as sessions_this_week,
          COALESCE(SUM(s.total_cost_usd), 0) as total_cost,
          COALESCE(SUM(s.total_cost_usd) FILTER (WHERE s.started_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as cost_this_month,
          COALESCE(SUM(s.total_cost_usd) FILTER (WHERE s.started_at >= DATE_TRUNC('week', CURRENT_DATE)), 0) as cost_this_week,
          COALESCE(SUM(s.total_input_tokens), 0) as total_input_tokens,
          COALESCE(SUM(s.total_input_tokens) FILTER (WHERE s.started_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as input_tokens_this_month,
          COALESCE(SUM(s.total_output_tokens), 0) as total_output_tokens,
          COALESCE(SUM(s.total_output_tokens) FILTER (WHERE s.started_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as output_tokens_this_month,
          COALESCE(AVG(s.duration_seconds), 0) as avg_duration,
          COALESCE(AVG(s.duration_seconds) FILTER (WHERE s.started_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as avg_duration_this_month
        FROM sessions s
        ${whereClause}
      ),
      model_stats AS (
        SELECT
          s.model_name as model,
          COUNT(*) as count,
          ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 2) as percentage
        FROM sessions s
        ${whereClause}
        GROUP BY s.model_name
        ORDER BY count DESC
        LIMIT 10
      ),
      project_stats AS (
        SELECT
          s.project_name as project,
          COUNT(*) as count,
          ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 2) as percentage
        FROM sessions s
        ${whereClause}${whereClause ? ' AND' : 'WHERE'} s.project_name IS NOT NULL
        GROUP BY s.project_name
        ORDER BY count DESC
        LIMIT 10
      ),
      tool_stats AS (
        SELECT 
          unnest(s.tools_used) as tool,
          COUNT(*) as count,
          ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 2) as percentage
        FROM sessions s
        ${whereClause}
        GROUP BY unnest(s.tools_used)
        ORDER BY count DESC
        LIMIT 10
      )
      SELECT 
        (SELECT row_to_json(session_stats) FROM session_stats) as metrics,
        (SELECT json_agg(model_stats) FROM model_stats) as top_models,
        (SELECT json_agg(project_stats) FROM project_stats) as top_projects,
        (SELECT json_agg(tool_stats) FROM tool_stats) as top_tools
    `;

    const result = await this.db.query(metricsQuery, params);
    const row = result.rows[0];

    if (!row) {
      throw new Error('No data found for metrics query');
    }

    const metrics = (row as any)['metrics'] || {};
    const topModels = (row as any)['top_models'] || [];
    const topProjects = (row as any)['top_projects'] || [];
    const topTools = (row as any)['top_tools'] || [];

    return {
      totalSessions: metrics.total_sessions || 0,
      sessionsThisMonth: metrics.sessions_this_month || 0,
      sessionsThisWeek: metrics.sessions_this_week || 0,
      totalCost: parseFloat(metrics.total_cost || '0'),
      costThisMonth: parseFloat(metrics.cost_this_month || '0'),
      costThisWeek: parseFloat(metrics.cost_this_week || '0'),
      totalInputTokens: metrics.total_input_tokens || 0,
      inputTokensThisMonth: metrics.input_tokens_this_month || 0,
      totalOutputTokens: metrics.total_output_tokens || 0,
      outputTokensThisMonth: metrics.output_tokens_this_month || 0,
      averageSessionDuration: parseFloat(metrics.avg_duration || '0'),
      avgDurationThisMonth: parseFloat(metrics.avg_duration_this_month || '0'),
      topModels: Array.isArray(topModels) ? topModels : [],
      topProjects: Array.isArray(topProjects) ? topProjects : [],
      topTools: Array.isArray(topTools) ? topTools : [],
    };
  }

  async getCostAnalysis(filters: AnalyticsFilters = {}): Promise<CostAnalysis> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const costQuery = `
      WITH daily_costs AS (
        SELECT 
          DATE(s.started_at) as date,
          COALESCE(SUM(s.total_cost_usd), 0) as value,
          COUNT(*) as count
        FROM sessions s
        ${whereClause}
        GROUP BY DATE(s.started_at)
        ORDER BY date DESC
        LIMIT 30
      ),
      weekly_costs AS (
        SELECT 
          DATE_TRUNC('week', s.started_at)::date as date,
          COALESCE(SUM(s.total_cost_usd), 0) as value,
          COUNT(*) as count
        FROM sessions s
        ${whereClause}
        GROUP BY DATE_TRUNC('week', s.started_at)
        ORDER BY date DESC
        LIMIT 12
      ),
      monthly_costs AS (
        SELECT 
          DATE_TRUNC('month', s.started_at)::date as date,
          COALESCE(SUM(s.total_cost_usd), 0) as value,
          COUNT(*) as count
        FROM sessions s
        ${whereClause}
        GROUP BY DATE_TRUNC('month', s.started_at)
        ORDER BY date DESC
        LIMIT 6
      ),
      cost_by_model AS (
        SELECT 
          s.model_name as model,
          COALESCE(SUM(s.total_cost_usd), 0) as cost,
          ROUND(SUM(s.total_cost_usd) / NULLIF(SUM(SUM(s.total_cost_usd)) OVER(), 0) * 100, 2) as percentage
        FROM sessions s
        ${whereClause}
        GROUP BY s.model_name
        ORDER BY cost DESC
        LIMIT 10
      ),
      cost_by_project AS (
        SELECT 
          s.project_name as project,
          COALESCE(SUM(s.total_cost_usd), 0) as cost,
          ROUND(SUM(s.total_cost_usd) / NULLIF(SUM(SUM(s.total_cost_usd)) OVER(), 0) * 100, 2) as percentage
        FROM sessions s
        ${whereClause}${whereClause ? ' AND' : 'WHERE'} s.project_name IS NOT NULL
        GROUP BY s.project_name
        ORDER BY cost DESC
        LIMIT 10
      ),
      expensive_sessions AS (
        SELECT 
          s.session_id,
          s.project_name,
          s.started_at,
          s.duration_seconds,
          s.total_cost_usd,
          s.total_input_tokens,
          s.total_output_tokens,
          s.model_name,
          s.tools_used
        FROM sessions s
        ${whereClause}
        ORDER BY s.total_cost_usd DESC
        LIMIT 10
      )
      SELECT 
        (SELECT json_agg(daily_costs ORDER BY date) FROM daily_costs) as daily_costs,
        (SELECT json_agg(weekly_costs ORDER BY date) FROM weekly_costs) as weekly_costs,
        (SELECT json_agg(monthly_costs ORDER BY date) FROM monthly_costs) as monthly_costs,
        (SELECT json_agg(cost_by_model) FROM cost_by_model) as cost_by_model,
        (SELECT json_agg(cost_by_project) FROM cost_by_project) as cost_by_project,
        (SELECT json_agg(expensive_sessions) FROM expensive_sessions) as most_expensive_sessions
    `;

    const result = await this.db.query(costQuery, params);
    const row = result.rows[0];

    if (!row) {
      throw new Error('No data found for cost analysis query');
    }

    const dailyCosts = (row as any)['daily_costs'] || [];
    const weeklyCosts = (row as any)['weekly_costs'] || [];
    const monthlyCosts = (row as any)['monthly_costs'] || [];
    const costByModel = (row as any)['cost_by_model'] || [];
    const costByProject = (row as any)['cost_by_project'] || [];
    const mostExpensiveSessions = (row as any)['most_expensive_sessions'] || [];

    return {
      dailyCosts: Array.isArray(dailyCosts)
        ? dailyCosts.map((item: { date: string; value: string; count: number }) => ({
            date: item.date,
            value: parseFloat(item.value),
            count: item.count,
          }))
        : [],
      weeklyCosts: Array.isArray(weeklyCosts)
        ? weeklyCosts.map((item: { date: string; value: string; count: number }) => ({
            date: item.date,
            value: parseFloat(item.value),
            count: item.count,
          }))
        : [],
      monthlyCosts: Array.isArray(monthlyCosts)
        ? monthlyCosts.map((item: { date: string; value: string; count: number }) => ({
            date: item.date,
            value: parseFloat(item.value),
            count: item.count,
          }))
        : [],
      costByModel: Array.isArray(costByModel)
        ? costByModel.map((item: { model: string; cost: string; percentage: string }) => ({
            model: item.model || 'Unknown',
            cost: parseFloat(item.cost),
            percentage: parseFloat(item.percentage) || 0,
          }))
        : [],
      costByProject: Array.isArray(costByProject)
        ? costByProject.map((item: { project: string; cost: string; percentage: string }) => ({
            project: item.project || 'Unknown',
            cost: parseFloat(item.cost),
            percentage: parseFloat(item.percentage) || 0,
          }))
        : [],
      mostExpensiveSessions: Array.isArray(mostExpensiveSessions) ? mostExpensiveSessions : [],
    };
  }

  async getTokenAnalysis(filters: AnalyticsFilters = {}): Promise<TokenAnalysis> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const tokenQuery = `
      WITH daily_tokens AS (
        SELECT 
          DATE(s.started_at) as date,
          COALESCE(SUM(s.total_input_tokens), 0) as input_tokens,
          COALESCE(SUM(s.total_output_tokens), 0) as output_tokens,
          COUNT(*) as count
        FROM sessions s
        ${whereClause}
        GROUP BY DATE(s.started_at)
        ORDER BY date DESC
        LIMIT 30
      ),
      weekly_tokens AS (
        SELECT 
          DATE_TRUNC('week', s.started_at)::date as date,
          COALESCE(SUM(s.total_input_tokens), 0) as input_tokens,
          COALESCE(SUM(s.total_output_tokens), 0) as output_tokens,
          COUNT(*) as count
        FROM sessions s
        ${whereClause}
        GROUP BY DATE_TRUNC('week', s.started_at)
        ORDER BY date DESC
        LIMIT 12
      ),
      monthly_tokens AS (
        SELECT 
          DATE_TRUNC('month', s.started_at)::date as date,
          COALESCE(SUM(s.total_input_tokens), 0) as input_tokens,
          COALESCE(SUM(s.total_output_tokens), 0) as output_tokens,
          COUNT(*) as count
        FROM sessions s
        ${whereClause}
        GROUP BY DATE_TRUNC('month', s.started_at)
        ORDER BY date DESC
        LIMIT 6
      ),
      tokens_by_model AS (
        SELECT 
          s.model_name as model,
          COALESCE(SUM(s.total_input_tokens), 0) as input_tokens,
          COALESCE(SUM(s.total_output_tokens), 0) as output_tokens
        FROM sessions s
        ${whereClause}
        GROUP BY s.model_name
        ORDER BY (SUM(s.total_input_tokens) + SUM(s.total_output_tokens)) DESC
        LIMIT 10
      ),
      token_efficiency AS (
        SELECT 
          DATE(s.started_at) as date,
          COALESCE(SUM(s.total_input_tokens), 0) as input_tokens,
          COALESCE(SUM(s.total_output_tokens), 0) as output_tokens,
          CASE 
            WHEN SUM(s.total_input_tokens) > 0 
            THEN ROUND(SUM(s.total_output_tokens)::numeric / SUM(s.total_input_tokens), 3)
            ELSE 0 
          END as efficiency_ratio
        FROM sessions s
        ${whereClause}
        GROUP BY DATE(s.started_at)
        ORDER BY date DESC
        LIMIT 30
      )
      SELECT 
        (SELECT json_agg(daily_tokens ORDER BY date) FROM daily_tokens) as daily_tokens,
        (SELECT json_agg(weekly_tokens ORDER BY date) FROM weekly_tokens) as weekly_tokens,
        (SELECT json_agg(monthly_tokens ORDER BY date) FROM monthly_tokens) as monthly_tokens,
        (SELECT json_agg(tokens_by_model) FROM tokens_by_model) as tokens_by_model,
        (SELECT json_agg(token_efficiency ORDER BY date) FROM token_efficiency) as token_efficiency
    `;

    const result = await this.db.query(tokenQuery, params);
    const row = result.rows[0];

    if (!row) {
      throw new Error('No data found for token analysis query');
    }

    const dailyTokens = (row as any)['daily_tokens'] || [];
    const weeklyTokens = (row as any)['weekly_tokens'] || [];
    const monthlyTokens = (row as any)['monthly_tokens'] || [];
    const tokensByModel = (row as any)['tokens_by_model'] || [];
    const tokenEfficiency = (row as any)['token_efficiency'] || [];

    const transformTokenData = (
      data: Array<{ date: string; input_tokens: number; output_tokens: number; count: number }>,
    ) => ({
      input: data.map((item) => ({
        date: item.date,
        value: item.input_tokens,
        count: item.count,
      })),
      output: data.map((item) => ({
        date: item.date,
        value: item.output_tokens,
        count: item.count,
      })),
    });

    return {
      dailyTokens: transformTokenData(Array.isArray(dailyTokens) ? dailyTokens : []),
      weeklyTokens: transformTokenData(Array.isArray(weeklyTokens) ? weeklyTokens : []),
      monthlyTokens: transformTokenData(Array.isArray(monthlyTokens) ? monthlyTokens : []),
      tokensByModel: Array.isArray(tokensByModel) ? tokensByModel : [],
      tokenEfficiency: Array.isArray(tokenEfficiency) ? tokenEfficiency : [],
    };
  }

  async getSessionsList(filters: AnalyticsFilters = {}): Promise<{
    sessions: SessionSummary[];
    total: number;
    hasMore: boolean;
  }> {
    const { whereClause, params } = this.buildWhereClause(filters);

    let nextParamIndex = params.length + 1;
    let limitClause = '';
    let offsetClause = '';

    if (filters.limit) {
      limitClause = `LIMIT $${nextParamIndex}`;
      params.push(filters.limit);
      nextParamIndex++;
    }

    if (filters.offset) {
      offsetClause = `OFFSET $${nextParamIndex}`;
      params.push(filters.offset);
      nextParamIndex++;
    }

    const sessionsQuery = `
      WITH session_data AS (
        SELECT 
          s.session_id,
          s.project_name,
          s.started_at,
          s.duration_seconds,
          s.total_cost_usd,
          s.total_input_tokens,
          s.total_output_tokens,
          s.model_name,
          s.tools_used
        FROM sessions s
        ${whereClause}
        ORDER BY s.started_at DESC
        ${limitClause} ${offsetClause}
      ),
      total_count AS (
        SELECT COUNT(*) as total FROM sessions s ${whereClause}
      )
      SELECT 
        (SELECT json_agg(session_data) FROM session_data) as sessions,
        (SELECT total FROM total_count) as total
    `;

    const result = await this.db.query(sessionsQuery, params);
    const row = result.rows[0];

    if (!row) {
      return {
        sessions: [],
        total: 0,
        hasMore: false,
      };
    }

    const sessions = (row as any)['sessions'] || [];
    const total = parseInt(String((row as any)['total'] || 0), 10);
    const hasMore =
      filters.offset !== undefined && filters.limit !== undefined
        ? filters.offset + filters.limit < total
        : false;

    return {
      sessions: Array.isArray(sessions) ? sessions : [],
      total,
      hasMore,
    };
  }

  async getSessionDetails(sessionId: string): Promise<SessionSummary | null> {
    const query = `
      SELECT 
        s.session_id,
        s.project_name,
        s.started_at,
        s.ended_at,
        s.duration_seconds,
        s.total_cost_usd,
        s.total_input_tokens,
        s.total_output_tokens,
        s.model_name,
        s.tools_used,
        s.cache_hit_count,
        s.cache_miss_count,
        (
          SELECT COUNT(*) 
          FROM raw_messages m 
          WHERE m.session_id = s.id
        ) as message_count
      FROM sessions s
      WHERE s.session_id = $1
    `;

    const result = await this.db.query(query, [sessionId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as unknown as SessionSummary;
  }

  async getDashboardSummary(filters: AnalyticsFilters = {}): Promise<{
    totalSessions: number;
    totalCost: number;
    totalTokens: number;
    averageCostPerSession: number;
    recentSessions: SessionSummary[];
  }> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const summaryQuery = `
      WITH summary_stats AS (
        SELECT 
          COUNT(*) as total_sessions,
          COALESCE(SUM(s.total_cost_usd), 0) as total_cost,
          COALESCE(SUM(s.total_input_tokens + s.total_output_tokens), 0) as total_tokens,
          CASE 
            WHEN COUNT(*) > 0 
            THEN COALESCE(SUM(s.total_cost_usd), 0) / COUNT(*)
            ELSE 0 
          END as avg_cost_per_session
        FROM sessions s
        ${whereClause}
      ),
      recent_sessions AS (
        SELECT 
          s.session_id,
          s.project_name,
          s.started_at,
          s.duration_seconds,
          s.total_cost_usd,
          s.total_input_tokens,
          s.total_output_tokens,
          s.model_name,
          s.tools_used
        FROM sessions s
        ${whereClause}
        ORDER BY s.started_at DESC
        LIMIT 5
      )
      SELECT 
        (SELECT row_to_json(summary_stats) FROM summary_stats) as summary,
        (SELECT json_agg(recent_sessions) FROM recent_sessions) as recent_sessions
    `;

    const result = await this.db.query(summaryQuery, params);
    const row = result.rows[0];

    if (!row) {
      return {
        totalSessions: 0,
        totalCost: 0,
        totalTokens: 0,
        averageCostPerSession: 0,
        recentSessions: [],
      };
    }

    const summary = (row as any)['summary'] || {};
    const recentSessions = (row as any)['recent_sessions'] || [];

    return {
      totalSessions: summary.total_sessions || 0,
      totalCost: parseFloat(summary.total_cost || '0'),
      totalTokens: summary.total_tokens || 0,
      averageCostPerSession: parseFloat(summary.avg_cost_per_session || '0'),
      recentSessions: Array.isArray(recentSessions) ? recentSessions : [],
    };
  }

  async getDailyUsageTimeSeries(filters: AnalyticsFilters = {}): Promise<{
    sessions: TimeSeriesPoint[];
    tokens: TimeSeriesPoint[];
    duration: TimeSeriesPoint[];
  }> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const usageQuery = `
      WITH daily_stats AS (
        SELECT 
          DATE(started_at) as date,
          COUNT(*) as session_count,
          SUM(total_input_tokens + total_output_tokens) as total_tokens,
          AVG(duration_seconds) as avg_duration_seconds
        FROM sessions s
        ${whereClause}
        GROUP BY DATE(started_at)
        ORDER BY date ASC
      )
      SELECT 
        date::TEXT as date,
        session_count,
        total_tokens,
        COALESCE(avg_duration_seconds, 0) as avg_duration_seconds
      FROM daily_stats
      ORDER BY date ASC
    `;

    const result = await this.db.query(usageQuery, params);

    const sessions: TimeSeriesPoint[] = [];
    const tokens: TimeSeriesPoint[] = [];
    const duration: TimeSeriesPoint[] = [];

    result.rows.forEach((row) => {
      const date = row['date'] as string;

      sessions.push({
        date,
        value: parseInt(row['session_count'] as string, 10),
        count: parseInt(row['session_count'] as string, 10),
      });

      tokens.push({
        date,
        value: parseInt(row['total_tokens'] as string, 10) || 0,
        count: parseInt(row['session_count'] as string, 10),
      });

      duration.push({
        date,
        value: parseFloat(row['avg_duration_seconds'] as string) || 0,
        count: parseInt(row['session_count'] as string, 10),
      });
    });

    return {
      sessions,
      tokens,
      duration,
    };
  }

  async getDistributionData(filters: AnalyticsFilters = {}): Promise<{
    modelUsage: Array<{ name: string; value: number }>;
    toolUsage: Array<{ name: string; value: number }>;
    projectUsage: Array<{ name: string; value: number }>;
  }> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const distributionQuery = `
      WITH model_distribution AS (
        SELECT 
          COALESCE(s.model_name, 'Unknown') as name,
          COUNT(*) as value
        FROM sessions s
        ${whereClause}
        GROUP BY s.model_name
        ORDER BY value DESC
        LIMIT 10
      ),
      tool_distribution AS (
        SELECT 
          unnest(s.tools_used) as name,
          COUNT(*) as value
        FROM sessions s
        ${whereClause}${whereClause ? ' AND' : 'WHERE'} s.tools_used IS NOT NULL AND array_length(s.tools_used, 1) > 0
        GROUP BY unnest(s.tools_used)
        ORDER BY value DESC
        LIMIT 10
      ),
      project_distribution AS (
        SELECT 
          COALESCE(s.project_name, 'Unknown') as name,
          COUNT(*) as value
        FROM sessions s
        ${whereClause}
        GROUP BY s.project_name
        ORDER BY value DESC
        LIMIT 10
      )
      SELECT 
        (SELECT json_agg(model_distribution ORDER BY value DESC) FROM model_distribution) as model_usage,
        (SELECT json_agg(tool_distribution ORDER BY value DESC) FROM tool_distribution) as tool_usage,
        (SELECT json_agg(project_distribution ORDER BY value DESC) FROM project_distribution) as project_usage
    `;

    const result = await this.db.query(distributionQuery, params);
    const row = result.rows[0];

    if (!row) {
      throw new Error('No data found for distribution query');
    }

    const modelUsage = (row as any)['model_usage'] || [];
    const toolUsage = (row as any)['tool_usage'] || [];
    const projectUsage = (row as any)['project_usage'] || [];

    return {
      modelUsage: Array.isArray(modelUsage)
        ? modelUsage.map((item: any) => ({
            name: item.name,
            value: parseInt(item.value, 10),
          }))
        : [],
      toolUsage: Array.isArray(toolUsage)
        ? toolUsage.map((item: any) => ({
            name: item.name,
            value: parseInt(item.value, 10),
          }))
        : [],
      projectUsage: Array.isArray(projectUsage)
        ? projectUsage.map((item: any) => ({
            name: item.name,
            value: parseInt(item.value, 10),
          }))
        : [],
    };
  }

  async getHourlyUsageHeatmap(filters: AnalyticsFilters = {}): Promise<
    Array<{
      hour: number;
      day: string;
      value: number;
    }>
  > {
    const { whereClause, params } = this.buildWhereClause(filters);

    const heatmapQuery = `
      SELECT 
        EXTRACT(hour FROM started_at) as hour,
        CASE EXTRACT(dow FROM started_at)
          WHEN 0 THEN 'Sun'
          WHEN 1 THEN 'Mon'
          WHEN 2 THEN 'Tue'
          WHEN 3 THEN 'Wed'
          WHEN 4 THEN 'Thu'
          WHEN 5 THEN 'Fri'
          WHEN 6 THEN 'Sat'
        END as day,
        COUNT(*) as value
      FROM sessions s
      ${whereClause}
      GROUP BY EXTRACT(hour FROM started_at), EXTRACT(dow FROM started_at)
      ORDER BY EXTRACT(dow FROM started_at), EXTRACT(hour FROM started_at)
    `;

    const result = await this.db.query(heatmapQuery, params);

    return result.rows.map((row) => ({
      hour: parseInt(row['hour'] as string, 10),
      day: row['day'] as string,
      value: parseInt(row['value'] as string, 10),
    }));
  }

  async getPerformanceMetrics(filters: AnalyticsFilters = {}): Promise<{
    sessionLengthDistribution: Array<{ range: string; count: number }>;
    tokenEfficiency: Array<{ date: string; tokensPerMinute: number }>;
    cacheStats: { hitRate: number; totalRequests: number };
  }> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const performanceQuery = `
      WITH session_length_buckets AS (
        SELECT 
          CASE 
            WHEN s.duration_seconds < 60 THEN '<1min'
            WHEN s.duration_seconds < 300 THEN '1-5min'
            WHEN s.duration_seconds < 900 THEN '5-15min'
            WHEN s.duration_seconds < 1800 THEN '15-30min'
            WHEN s.duration_seconds < 3600 THEN '30-60min'
            ELSE '>1hour'
          END as range,
          COUNT(*) as count
        FROM sessions s
        ${whereClause}${whereClause ? ' AND' : 'WHERE'} s.duration_seconds IS NOT NULL
        GROUP BY 
          CASE 
            WHEN s.duration_seconds < 60 THEN '<1min'
            WHEN s.duration_seconds < 300 THEN '1-5min'
            WHEN s.duration_seconds < 900 THEN '5-15min'
            WHEN s.duration_seconds < 1800 THEN '15-30min'
            WHEN s.duration_seconds < 3600 THEN '30-60min'
            ELSE '>1hour'
          END
        ORDER BY count DESC
      ),
      token_efficiency AS (
        SELECT 
          DATE(s.started_at) as date,
          AVG((s.total_input_tokens + s.total_output_tokens)::float / GREATEST(s.duration_seconds / 60, 0.1)) as tokens_per_minute
        FROM sessions s
        ${whereClause}${whereClause ? ' AND' : 'WHERE'} s.duration_seconds > 0 AND (s.total_input_tokens + s.total_output_tokens) > 0
        GROUP BY DATE(s.started_at)
        ORDER BY date DESC
        LIMIT 30
      ),
      cache_stats AS (
        SELECT
          CASE
            WHEN SUM(s.cache_hit_count) + SUM(s.cache_miss_count) > 0
            THEN SUM(s.cache_hit_count)::float / (SUM(s.cache_hit_count) + SUM(s.cache_miss_count))
            ELSE NULL
          END as hit_rate,
          SUM(s.cache_hit_count) + SUM(s.cache_miss_count) as total_requests
        FROM sessions s
        ${whereClause}
      )
      SELECT 
        (SELECT json_agg(session_length_buckets ORDER BY range) FROM session_length_buckets) as session_length_distribution,
        (SELECT json_agg(token_efficiency ORDER BY date) FROM token_efficiency) as token_efficiency,
        (SELECT row_to_json(cache_stats) FROM cache_stats) as cache_stats
    `;

    const result = await this.db.query(performanceQuery, params);
    const row = result.rows[0];

    if (!row) {
      throw new Error('No data found for performance metrics query');
    }

    const sessionLengthDistribution = (row as any)['session_length_distribution'] || [];
    const tokenEfficiency = (row as any)['token_efficiency'] || [];
    const cacheStats = (row as any)['cache_stats'] || { hit_rate: 0, total_requests: 0 };

    return {
      sessionLengthDistribution: Array.isArray(sessionLengthDistribution)
        ? sessionLengthDistribution.map((item: any) => ({
            range: item.range,
            count: parseInt(item.count, 10),
          }))
        : [],
      tokenEfficiency: Array.isArray(tokenEfficiency)
        ? tokenEfficiency.map((item: any) => ({
            date: item.date,
            tokensPerMinute: parseFloat(item.tokens_per_minute) || 0,
          }))
        : [],
      cacheStats: {
        hitRate: parseFloat(cacheStats.hit_rate) || 0,
        totalRequests: parseInt(cacheStats.total_requests, 10) || 0,
      },
    };
  }

  async getTrendAnalysis(filters: AnalyticsFilters = {}): Promise<TrendAnalysis> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const trendQuery = `
      WITH current_week AS (
        SELECT 
          COUNT(*) as sessions,
          COALESCE(SUM(s.total_cost_usd), 0) as cost,
          COALESCE(SUM(s.total_input_tokens + s.total_output_tokens), 0) as tokens
        FROM sessions s
        ${whereClause}${whereClause ? ' AND' : 'WHERE'} s.started_at >= DATE_TRUNC('week', CURRENT_DATE)
      ),
      previous_week AS (
        SELECT 
          COUNT(*) as sessions,
          COALESCE(SUM(s.total_cost_usd), 0) as cost,
          COALESCE(SUM(s.total_input_tokens + s.total_output_tokens), 0) as tokens
        FROM sessions s
        ${whereClause}${whereClause ? ' AND' : 'WHERE'} 
          s.started_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week'
          AND s.started_at < DATE_TRUNC('week', CURRENT_DATE)
      ),
      current_month AS (
        SELECT 
          COUNT(*) as sessions,
          COALESCE(SUM(s.total_cost_usd), 0) as cost,
          COALESCE(SUM(s.total_input_tokens + s.total_output_tokens), 0) as tokens
        FROM sessions s
        ${whereClause}${whereClause ? ' AND' : 'WHERE'} s.started_at >= DATE_TRUNC('month', CURRENT_DATE)
      ),
      previous_month AS (
        SELECT 
          COUNT(*) as sessions,
          COALESCE(SUM(s.total_cost_usd), 0) as cost,
          COALESCE(SUM(s.total_input_tokens + s.total_output_tokens), 0) as tokens
        FROM sessions s
        ${whereClause}${whereClause ? ' AND' : 'WHERE'} 
          s.started_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
          AND s.started_at < DATE_TRUNC('month', CURRENT_DATE)
      ),
      seasonal_patterns AS (
        SELECT 
          TO_CHAR(s.started_at, 'Month') as month,
          COUNT(*) as sessions,
          COALESCE(SUM(s.total_cost_usd), 0) as cost,
          COALESCE(SUM(s.total_input_tokens + s.total_output_tokens), 0) as tokens
        FROM sessions s
        ${whereClause}
        GROUP BY TO_CHAR(s.started_at, 'Month'), EXTRACT(month FROM s.started_at)
        ORDER BY EXTRACT(month FROM s.started_at)
      ),
      daily_stats AS (
        SELECT 
          DATE(s.started_at) as date,
          COUNT(*) as sessions,
          COALESCE(SUM(s.total_cost_usd), 0) as cost,
          COALESCE(SUM(s.total_input_tokens + s.total_output_tokens), 0) as tokens
        FROM sessions s
        ${whereClause}
        GROUP BY DATE(s.started_at)
        ORDER BY date DESC
        LIMIT 30
      ),
      stats_with_avg AS (
        SELECT 
          *,
          AVG(sessions) OVER() as avg_sessions,
          AVG(cost) OVER() as avg_cost,
          AVG(tokens) OVER() as avg_tokens,
          STDDEV(sessions) OVER() as stddev_sessions,
          STDDEV(cost) OVER() as stddev_cost,
          STDDEV(tokens) OVER() as stddev_tokens
        FROM daily_stats
      ),
      anomalies AS (
        SELECT 
          date,
          'sessions'::text as type,
          sessions as value,
          avg_sessions as expected_value,
          ABS(sessions - avg_sessions) / NULLIF(stddev_sessions, 0) as deviation
        FROM stats_with_avg
        WHERE ABS(sessions - avg_sessions) > 2 * COALESCE(stddev_sessions, 1)
        UNION ALL
        SELECT 
          date,
          'cost'::text as type,
          cost as value,
          avg_cost as expected_value,
          ABS(cost - avg_cost) / NULLIF(stddev_cost, 0) as deviation
        FROM stats_with_avg
        WHERE ABS(cost - avg_cost) > 2 * COALESCE(stddev_cost, 1)
        UNION ALL
        SELECT 
          date,
          'tokens'::text as type,
          tokens as value,
          avg_tokens as expected_value,
          ABS(tokens - avg_tokens) / NULLIF(stddev_tokens, 0) as deviation
        FROM stats_with_avg
        WHERE ABS(tokens - avg_tokens) > 2 * COALESCE(stddev_tokens, 1)
      )
      SELECT 
        (SELECT row_to_json(current_week) FROM current_week) as current_week,
        (SELECT row_to_json(previous_week) FROM previous_week) as previous_week,
        (SELECT row_to_json(current_month) FROM current_month) as current_month,
        (SELECT row_to_json(previous_month) FROM previous_month) as previous_month,
        (SELECT json_agg(seasonal_patterns ORDER BY month) FROM seasonal_patterns) as seasonal_patterns,
        (SELECT json_agg(anomalies ORDER BY date DESC) FROM anomalies) as anomalies
    `;

    const result = await this.db.query(trendQuery, params);
    const row = result.rows[0];

    if (!row) {
      throw new Error('No data found for trend analysis query');
    }

    const currentWeek = (row as any)['current_week'] || { sessions: 0, cost: 0, tokens: 0 };
    const previousWeek = (row as any)['previous_week'] || { sessions: 0, cost: 0, tokens: 0 };
    const currentMonth = (row as any)['current_month'] || { sessions: 0, cost: 0, tokens: 0 };
    const previousMonth = (row as any)['previous_month'] || { sessions: 0, cost: 0, tokens: 0 };
    const seasonalPatterns = (row as any)['seasonal_patterns'] || [];
    const anomalies = (row as any)['anomalies'] || [];

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      weekOverWeekGrowth: {
        sessions: {
          current: currentWeek.sessions,
          previous: previousWeek.sessions,
          growth: calculateGrowth(currentWeek.sessions, previousWeek.sessions),
        },
        cost: {
          current: parseFloat(currentWeek.cost),
          previous: parseFloat(previousWeek.cost),
          growth: calculateGrowth(parseFloat(currentWeek.cost), parseFloat(previousWeek.cost)),
        },
        tokens: {
          current: currentWeek.tokens,
          previous: previousWeek.tokens,
          growth: calculateGrowth(currentWeek.tokens, previousWeek.tokens),
        },
      },
      monthOverMonthGrowth: {
        sessions: {
          current: currentMonth.sessions,
          previous: previousMonth.sessions,
          growth: calculateGrowth(currentMonth.sessions, previousMonth.sessions),
        },
        cost: {
          current: parseFloat(currentMonth.cost),
          previous: parseFloat(previousMonth.cost),
          growth: calculateGrowth(parseFloat(currentMonth.cost), parseFloat(previousMonth.cost)),
        },
        tokens: {
          current: currentMonth.tokens,
          previous: previousMonth.tokens,
          growth: calculateGrowth(currentMonth.tokens, previousMonth.tokens),
        },
      },
      seasonalPatterns: Array.isArray(seasonalPatterns)
        ? seasonalPatterns.map((item: any) => ({
            month: item.month.trim(),
            sessions: parseInt(item.sessions, 10),
            cost: parseFloat(item.cost),
            tokens: parseInt(item.tokens, 10),
          }))
        : [],
      anomalyDetection: Array.isArray(anomalies)
        ? anomalies.map((item: any) => ({
            date: item.date,
            type: item.type as 'sessions' | 'cost' | 'tokens',
            value: parseFloat(item.value),
            expectedValue: parseFloat(item.expected_value),
            deviation: parseFloat(item.deviation) || 0,
          }))
        : [],
    };
  }

  async getCostOptimizationInsights(
    filters: AnalyticsFilters = {},
  ): Promise<CostOptimizationInsights> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const optimizationQuery = `
      WITH expensive_sessions AS (
        SELECT 
          s.*,
          CASE 
            WHEN s.total_input_tokens + s.total_output_tokens > 0
            THEN (s.total_input_tokens + s.total_output_tokens)::float / GREATEST(s.total_cost_usd, 0.001)
            ELSE 0
          END as efficiency
        FROM sessions s
        ${whereClause}
        ORDER BY s.total_cost_usd DESC
        LIMIT 10
      ),
      model_efficiency AS (
        SELECT 
          s.model_name as model,
          AVG(s.total_cost_usd) as avg_cost_per_session,
          AVG(s.total_input_tokens + s.total_output_tokens) as avg_tokens_per_session,
          AVG(
            CASE 
              WHEN s.total_cost_usd > 0
              THEN (s.total_input_tokens + s.total_output_tokens)::float / s.total_cost_usd
              ELSE 0
            END
          ) as efficiency
        FROM sessions s
        ${whereClause}${whereClause ? ' AND' : 'WHERE'} s.model_name IS NOT NULL
        GROUP BY s.model_name
        HAVING COUNT(*) >= 3
        ORDER BY efficiency DESC
      ),
      current_month_budget AS (
        SELECT 
          COALESCE(SUM(s.total_cost_usd), 0) as current_spend,
          EXTRACT(day FROM CURRENT_DATE) as days_elapsed,
          EXTRACT(day FROM DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') as days_in_month
        FROM sessions s
        ${whereClause}${whereClause ? ' AND' : 'WHERE'} s.started_at >= DATE_TRUNC('month', CURRENT_DATE)
      )
      SELECT 
        (SELECT json_agg(expensive_sessions ORDER BY total_cost_usd DESC) FROM expensive_sessions) as expensive_sessions,
        (SELECT json_agg(model_efficiency ORDER BY efficiency DESC) FROM model_efficiency) as model_efficiency,
        (SELECT row_to_json(current_month_budget) FROM current_month_budget) as budget_info
    `;

    const result = await this.db.query(optimizationQuery, params);
    const row = result.rows[0];

    if (!row) {
      throw new Error('No data found for cost optimization query');
    }

    const expensiveSessions = (row as any)['expensive_sessions'] || [];
    const modelEfficiency = (row as any)['model_efficiency'] || [];
    const budgetInfo = (row as any)['budget_info'] || {
      current_spend: 0,
      days_elapsed: 1,
      days_in_month: 30,
    };

    const projectedSpend =
      budgetInfo.days_elapsed > 0
        ? (parseFloat(budgetInfo.current_spend) / budgetInfo.days_elapsed) *
          budgetInfo.days_in_month
        : 0;

    // Set a reasonable default monthly budget - can be made configurable later
    const monthlyBudgetLimit = parseFloat(process.env['MONTHLY_BUDGET_LIMIT'] ?? '100');
    const currentSpend = parseFloat(budgetInfo.current_spend) || 0;

    const recommendations = [];
    if (Array.isArray(modelEfficiency) && modelEfficiency.length > 1) {
      const mostEfficient = modelEfficiency[0];
      const leastEfficient = modelEfficiency[modelEfficiency.length - 1];

      if (mostEfficient.efficiency > leastEfficient.efficiency * 1.5) {
        recommendations.push({
          currentModel: leastEfficient.model,
          recommendedModel: mostEfficient.model,
          potentialSavings:
            parseFloat(leastEfficient.avg_cost_per_session) -
            parseFloat(mostEfficient.avg_cost_per_session),
          reason: `${mostEfficient.model} provides ${(mostEfficient.efficiency / leastEfficient.efficiency).toFixed(1)}x better token-to-cost ratio`,
        });
      }
    }

    return {
      mostExpensiveSessions: Array.isArray(expensiveSessions) ? expensiveSessions : [],
      costPerOutcomeAnalysis: Array.isArray(modelEfficiency)
        ? modelEfficiency.map((item: any) => ({
            model: item.model || 'Unknown',
            avgCostPerSession: parseFloat(item.avg_cost_per_session) || 0,
            avgTokensPerSession: parseFloat(item.avg_tokens_per_session) || 0,
            efficiency: parseFloat(item.efficiency) || 0,
          }))
        : [],
      modelEfficiencyRecommendations: recommendations,
      budgetTracking: {
        currentMonthSpend: currentSpend,
        projectedMonthSpend: projectedSpend,
        budgetLimit: monthlyBudgetLimit,
        budgetUtilization: monthlyBudgetLimit > 0 ? (currentSpend / monthlyBudgetLimit) * 100 : 0,
        daysRemaining: Math.max(0, budgetInfo.days_in_month - budgetInfo.days_elapsed),
      },
    };
  }
}
