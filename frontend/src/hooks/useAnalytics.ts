import { useQuery } from '@tanstack/react-query';

// Types for analytics data
export interface OverviewMetrics {
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
  dailyCosts: Array<{ date: string; value: number; count: number }>;
  weeklyCosts: Array<{ date: string; value: number; count: number }>;
  monthlyCosts: Array<{ date: string; value: number; count: number }>;
  costByModel: Array<{ model: string; cost: number; percentage: number }>;
  costByProject: Array<{ project: string; cost: number; percentage: number }>;
  mostExpensiveSessions: Array<{
    session_id: string;
    project_name?: string;
    started_at: Date;
    duration_seconds?: number;
    total_cost_usd: number;
    total_input_tokens: number;
    total_output_tokens: number;
    model_name?: string;
    tools_used: string[];
  }>;
}

export interface DailyUsageTimeSeries {
  sessions: Array<{ date: string; value: number; count: number }>;
  tokens: Array<{ date: string; value: number; count: number }>;
  duration: Array<{ date: string; value: number; count: number }>;
}

export interface DistributionData {
  modelUsage: Array<{ name: string; value: number }>;
  toolUsage: Array<{ name: string; value: number }>;
  projectUsage: Array<{ name: string; value: number }>;
}

export interface HeatmapData {
  hour: number;
  day: string;
  value: number;
}

export interface PerformanceMetrics {
  sessionLengthDistribution: Array<{ range: string; count: number }>;
  tokenEfficiency: Array<{ date: string; tokensPerMinute: number }>;
  cacheStats: { hitRate: number; totalRequests: number };
}

export interface DateRange {
  start: string;
  end: string;
}

const API_BASE = 'http://localhost:3001/api';

// Helper function to build query string with date filters
function buildQueryString(dateRange?: DateRange): string {
  if (!dateRange) return '';
  
  const params = new URLSearchParams();
  if (dateRange.start) params.append('dateFrom', dateRange.start);
  if (dateRange.end) params.append('dateTo', dateRange.end);
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

// Fetch functions
async function fetchOverviewMetrics(dateRange?: DateRange): Promise<OverviewMetrics> {
  const response = await fetch(`${API_BASE}/analytics${buildQueryString(dateRange)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch overview metrics');
  }
  const result = await response.json();
  return result.data || result;
}

async function fetchCostAnalysis(dateRange?: DateRange): Promise<CostAnalysis> {
  const response = await fetch(`${API_BASE}/analytics/costs${buildQueryString(dateRange)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch cost analysis');
  }
  return response.json();
}

async function fetchDailyUsageTimeSeries(dateRange?: DateRange): Promise<DailyUsageTimeSeries> {
  const response = await fetch(`${API_BASE}/analytics/daily-usage${buildQueryString(dateRange)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch daily usage time series');
  }
  return response.json();
}

async function fetchDistributionData(dateRange?: DateRange): Promise<DistributionData> {
  const response = await fetch(`${API_BASE}/analytics/distributions${buildQueryString(dateRange)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch distribution data');
  }
  return response.json();
}

async function fetchHeatmapData(dateRange?: DateRange): Promise<HeatmapData[]> {
  const response = await fetch(`${API_BASE}/analytics/heatmap${buildQueryString(dateRange)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch heatmap data');
  }
  return response.json();
}

async function fetchPerformanceMetrics(dateRange?: DateRange): Promise<PerformanceMetrics> {
  const response = await fetch(`${API_BASE}/analytics/performance${buildQueryString(dateRange)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch performance metrics');
  }
  return response.json();
}

// React Query hooks
export function useOverviewMetrics(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'overview', dateRange],
    queryFn: () => fetchOverviewMetrics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCostAnalysis(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'costs', dateRange],
    queryFn: () => fetchCostAnalysis(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useDailyUsageTimeSeries(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'daily-usage', dateRange],
    queryFn: () => fetchDailyUsageTimeSeries(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useDistributionData(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'distributions', dateRange],
    queryFn: () => fetchDistributionData(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useHeatmapData(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'heatmap', dateRange],
    queryFn: () => fetchHeatmapData(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function usePerformanceMetrics(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'performance', dateRange],
    queryFn: () => fetchPerformanceMetrics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Utility function to format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

// Utility function to format large numbers
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

// Utility function to format duration in seconds
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  }
  return `${Math.round(seconds / 3600)}h`;
}