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

export interface DataQualityMetrics {
  totalSessions: number;
  completeSessions: number;
  incompleteSessions: number;
  duplicateSessions: number;
  orphanedMetrics: number;
  missingData: {
    sessionsWithoutEndTime: number;
    sessionsWithoutDuration: number;
    sessionsWithoutTokens: number;
    sessionsWithoutCost: number;
    metricsWithoutMessages: number;
  };
  dataIntegrity: {
    negativeTokens: number;
    negativeCosts: number;
    invalidDurations: number;
    futureTimestamps: number;
    inconsistentAggregates: number;
  };
  dataCompleteness: {
    completenessScore: number;
    missingFields: string[];
    qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  duplicateAnalysis: Array<{
    sessionId: string;
    duplicateCount: number;
    firstSeen: string;
    lastSeen: string;
  }>;
  recommendations: Array<{
    type: 'warning' | 'error' | 'info';
    title: string;
    description: string;
    affectedRecords: number;
    action?: string;
  }>;
}

export interface CleanupResult {
  deletedRecords: number;
  message: string;
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

  async getHourlyUsageHeatmap(filters: AnalyticsFilters = {}): Promise<Array<{
    hour: number;
    day: string;
    value: number;
  }>> {
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
          AVG(CASE WHEN s.cache_hit_count > 0 THEN 1.0 ELSE 0.0 END) as hit_rate,
          COUNT(*) as total_requests
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

  // Data Quality Methods

  async getDataQualityMetrics(): Promise<DataQualityMetrics> {
    const query = `
      WITH quality_analysis AS (
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(*) FILTER (WHERE ended_at IS NOT NULL AND duration_seconds IS NOT NULL AND duration_seconds > 0) as complete_sessions,
          COUNT(*) FILTER (WHERE ended_at IS NULL) as sessions_without_end_time,
          COUNT(*) FILTER (WHERE duration_seconds IS NULL OR duration_seconds <= 0) as sessions_without_duration,
          COUNT(*) FILTER (WHERE total_input_tokens = 0 AND total_output_tokens = 0) as sessions_without_tokens,
          COUNT(*) FILTER (WHERE total_cost_usd = 0) as sessions_without_cost,
          COUNT(*) FILTER (WHERE total_input_tokens < 0 OR total_output_tokens < 0) as negative_tokens,
          COUNT(*) FILTER (WHERE total_cost_usd < 0) as negative_costs,
          COUNT(*) FILTER (WHERE duration_seconds < 0) as invalid_durations,
          COUNT(*) FILTER (WHERE started_at > NOW() OR ended_at > NOW()) as future_timestamps,
          COUNT(*) FILTER (WHERE ended_at < started_at) as inconsistent_timestamps
        FROM sessions
      ),
      duplicate_sessions AS (
        SELECT session_id, COUNT(*) as duplicate_count,
               MIN(created_at) as first_seen,
               MAX(created_at) as last_seen
        FROM sessions 
        GROUP BY session_id 
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC
        LIMIT 50
      ),
      orphaned_metrics AS (
        SELECT COUNT(*) as count
        FROM session_metrics sm
        LEFT JOIN sessions s ON sm.session_id = s.id
        WHERE s.id IS NULL
      ),
      metrics_without_messages AS (
        SELECT COUNT(*) as count
        FROM session_metrics sm
        WHERE sm.message_count = 0
          AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = sm.session_id)
      )
      SELECT 
        qa.*,
        (SELECT COUNT(*) FROM duplicate_sessions) as duplicate_count,
        (SELECT count FROM orphaned_metrics) as orphaned_metrics,
        (SELECT count FROM metrics_without_messages) as metrics_without_messages,
        (SELECT json_agg(duplicate_sessions) FROM duplicate_sessions) as duplicates_list
      FROM quality_analysis qa
    `;

    const result = await this.db.query(query);
    const row = result.rows[0];

    if (!row) {
      throw new Error('Failed to fetch data quality metrics');
    }

    const totalSessions = parseInt(row.total_sessions) || 0;
    const completeSessions = parseInt(row.complete_sessions) || 0;
    const duplicateCount = parseInt(row.duplicate_count) || 0;
    
    const missing = {
      sessionsWithoutEndTime: parseInt(row.sessions_without_end_time) || 0,
      sessionsWithoutDuration: parseInt(row.sessions_without_duration) || 0,
      sessionsWithoutTokens: parseInt(row.sessions_without_tokens) || 0,
      sessionsWithoutCost: parseInt(row.sessions_without_cost) || 0,
      metricsWithoutMessages: parseInt(row.metrics_without_messages) || 0,
    };

    const integrity = {
      negativeTokens: parseInt(row.negative_tokens) || 0,
      negativeCosts: parseInt(row.negative_costs) || 0,
      invalidDurations: parseInt(row.invalid_durations) || 0,
      futureTimestamps: parseInt(row.future_timestamps) || 0,
      inconsistentAggregates: parseInt(row.inconsistent_timestamps) || 0,
    };

    // Calculate completeness score
    const totalIssues = Object.values(missing).reduce((sum, val) => sum + val, 0) +
                       Object.values(integrity).reduce((sum, val) => sum + val, 0);
    const completenessScore = totalSessions > 0 ? Math.max(0, Math.round((1 - totalIssues / totalSessions) * 100)) : 100;
    
    // Determine quality grade
    let qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (completenessScore >= 95) qualityGrade = 'A';
    else if (completenessScore >= 85) qualityGrade = 'B';
    else if (completenessScore >= 75) qualityGrade = 'C';
    else if (completenessScore >= 60) qualityGrade = 'D';
    else qualityGrade = 'F';

    // Generate recommendations
    const recommendations: Array<{
      type: 'warning' | 'error' | 'info';
      title: string;
      description: string;
      affectedRecords: number;
      action?: string;
    }> = [];

    if (duplicateCount > 0) {
      recommendations.push({
        type: 'error',
        title: 'Duplicate Sessions Detected',
        description: `Found ${duplicateCount} session IDs with multiple records. This may cause incorrect analytics.`,
        affectedRecords: duplicateCount,
        action: 'Review and merge duplicate sessions'
      });
    }

    if (missing.sessionsWithoutEndTime > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Incomplete Sessions',
        description: `${missing.sessionsWithoutEndTime} sessions are missing end times, indicating incomplete data.`,
        affectedRecords: missing.sessionsWithoutEndTime,
        action: 'Re-sync recent sessions'
      });
    }

    if (integrity.negativeTokens > 0 || integrity.negativeCosts > 0) {
      recommendations.push({
        type: 'error',
        title: 'Invalid Data Values',
        description: 'Found negative values in token counts or costs. This indicates data corruption.',
        affectedRecords: integrity.negativeTokens + integrity.negativeCosts,
        action: 'Investigate and correct invalid records'
      });
    }

    if (totalSessions > 1000 && duplicateCount === 0 && totalIssues < 10) {
      recommendations.push({
        type: 'info',
        title: 'Excellent Data Quality',
        description: 'Your data quality is excellent with minimal issues detected.',
        affectedRecords: 0
      });
    }

    const duplicatesList = Array.isArray(row.duplicates_list) ? row.duplicates_list : [];

    return {
      totalSessions,
      completeSessions,
      incompleteSessions: totalSessions - completeSessions,
      duplicateSessions: duplicateCount,
      orphanedMetrics: parseInt(row.orphaned_metrics) || 0,
      missingData: missing,
      dataIntegrity: integrity,
      dataCompleteness: {
        completenessScore,
        missingFields: [],
        qualityGrade,
      },
      duplicateAnalysis: duplicatesList.map((item: any) => ({
        sessionId: item.session_id,
        duplicateCount: parseInt(item.duplicate_count),
        firstSeen: item.first_seen,
        lastSeen: item.last_seen,
      })),
      recommendations,
    };
  }

  async cleanupDuplicateSessions(): Promise<CleanupResult> {
    const cleanupQuery = `
      WITH duplicates AS (
        SELECT id, session_id,
               ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at DESC) as rn
        FROM sessions
      ),
      deleted AS (
        DELETE FROM sessions 
        WHERE id IN (
          SELECT id FROM duplicates WHERE rn > 1
        )
        RETURNING session_id
      )
      SELECT COUNT(*) as deleted_count FROM deleted
    `;

    const result = await this.db.query(cleanupQuery);
    const deletedCount = parseInt(result.rows[0]?.deleted_count) || 0;

    return {
      deletedRecords: deletedCount,
      message: `Successfully removed ${deletedCount} duplicate sessions`
    };
  }

  async cleanupOrphanedMetrics(): Promise<CleanupResult> {
    const cleanupQuery = `
      WITH orphaned AS (
        DELETE FROM session_metrics 
        WHERE session_id NOT IN (SELECT id FROM sessions)
        RETURNING id
      )
      SELECT COUNT(*) as deleted_count FROM orphaned
    `;

    const result = await this.db.query(cleanupQuery);
    const deletedCount = parseInt(result.rows[0]?.deleted_count) || 0;

    return {
      deletedRecords: deletedCount,
      message: `Successfully removed ${deletedCount} orphaned metric records`
    };
  }

  async validateDataIntegrity(): Promise<any[]> {
    const validationQuery = `
      SELECT 
        'sessions' as table_name,
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE session_id IS NULL OR session_id = '') as invalid_session_ids,
        COUNT(*) FILTER (WHERE started_at IS NULL) as missing_start_times,
        COUNT(*) FILTER (WHERE model_name IS NULL OR model_name = '') as missing_models
      FROM sessions
      
      UNION ALL
      
      SELECT 
        'session_metrics' as table_name,
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE session_id IS NULL) as invalid_session_refs,
        COUNT(*) FILTER (WHERE date_bucket IS NULL) as missing_dates,
        COUNT(*) FILTER (WHERE input_tokens < 0 OR output_tokens < 0) as negative_tokens
      FROM session_metrics
    `;

    const result = await this.db.query(validationQuery);
    return result.rows;
  }
}
