import { useQuery } from '@tanstack/react-query';

// Frontend-specific type definitions to avoid cross-boundary imports
export interface AnalyticsFilters {
  dateFrom?: Date;
  dateTo?: Date;
  projectName?: string;
  modelName?: string;
  sessionIds?: string[];
  limit?: number;
  offset?: number;
}

interface SessionWithEfficiency {
  session_id: string;
  project_name?: string;
  started_at: string;
  duration_seconds?: number;
  total_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
  model_name?: string;
  tools_used: string[];
  efficiency: number;
}

interface TrendAnalysis {
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

interface CostOptimizationInsights {
  mostExpensiveSessions: SessionWithEfficiency[];
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

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

async function fetchTrendAnalysis(filters: AnalyticsFilters): Promise<TrendAnalysis> {
  const params = new URLSearchParams();

  if (filters.dateFrom) {
    params.append('dateFrom', filters.dateFrom.toISOString());
  }
  if (filters.dateTo) {
    params.append('dateTo', filters.dateTo.toISOString());
  }
  if (filters.projectName) {
    params.append('projectName', filters.projectName);
  }
  if (filters.modelName) {
    params.append('modelName', filters.modelName);
  }

  const url = `${API_BASE_URL}/trends/analysis${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch trend analysis: ${response.statusText}`);
  }

  const result: ApiResponse<TrendAnalysis> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch trend analysis');
  }

  return result.data;
}

async function fetchCostOptimizationInsights(
  filters: AnalyticsFilters,
): Promise<CostOptimizationInsights> {
  const params = new URLSearchParams();

  if (filters.dateFrom) {
    params.append('dateFrom', filters.dateFrom.toISOString());
  }
  if (filters.dateTo) {
    params.append('dateTo', filters.dateTo.toISOString());
  }
  if (filters.projectName) {
    params.append('projectName', filters.projectName);
  }
  if (filters.modelName) {
    params.append('modelName', filters.modelName);
  }

  const url = `${API_BASE_URL}/trends/cost-optimization${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch cost optimization insights: ${response.statusText}`);
  }

  const result: ApiResponse<CostOptimizationInsights> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch cost optimization insights');
  }

  return result.data;
}

export function useTrendAnalysis(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: ['trends', 'analysis', filters],
    queryFn: () => fetchTrendAnalysis(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

export function useCostOptimizationInsights(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: ['trends', 'cost-optimization', filters],
    queryFn: () => fetchCostOptimizationInsights(filters),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
    retry: 2,
  });
}
