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
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  averageSessionDuration: number;
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
          COALESCE(SUM(s.total_cost_usd), 0) as total_cost,
          COALESCE(SUM(s.total_input_tokens), 0) as total_input_tokens,
          COALESCE(SUM(s.total_output_tokens), 0) as total_output_tokens,
          COALESCE(AVG(s.duration_seconds), 0) as avg_duration
        FROM sessions s
        ${whereClause}
      ),
      model_stats AS (
        SELECT 
          s.model_name,
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
          s.project_name,
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
      totalCost: parseFloat(metrics.total_cost || '0'),
      totalInputTokens: metrics.total_input_tokens || 0,
      totalOutputTokens: metrics.total_output_tokens || 0,
      averageSessionDuration: parseFloat(metrics.avg_duration || '0'),
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
      dailyCosts: Array.isArray(dailyCosts) ? dailyCosts.map(
        (item: { date: string; value: string; count: number }) => ({
          date: item.date,
          value: parseFloat(item.value),
          count: item.count,
        }),
      ) : [],
      weeklyCosts: Array.isArray(weeklyCosts) ? weeklyCosts.map(
        (item: { date: string; value: string; count: number }) => ({
          date: item.date,
          value: parseFloat(item.value),
          count: item.count,
        }),
      ) : [],
      monthlyCosts: Array.isArray(monthlyCosts) ? monthlyCosts.map(
        (item: { date: string; value: string; count: number }) => ({
          date: item.date,
          value: parseFloat(item.value),
          count: item.count,
        }),
      ) : [],
      costByModel: Array.isArray(costByModel) ? costByModel.map(
        (item: { model: string; cost: string; percentage: string }) => ({
          model: item.model || 'Unknown',
          cost: parseFloat(item.cost),
          percentage: parseFloat(item.percentage) || 0,
        }),
      ) : [],
      costByProject: Array.isArray(costByProject) ? costByProject.map(
        (item: { project: string; cost: string; percentage: string }) => ({
          project: item.project || 'Unknown',
          cost: parseFloat(item.cost),
          percentage: parseFloat(item.percentage) || 0,
        }),
      ) : [],
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
}
