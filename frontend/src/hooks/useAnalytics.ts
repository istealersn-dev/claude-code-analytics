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

const API_BASE = 'http://localhost:3001/api';

// Fetch functions
async function fetchOverviewMetrics(): Promise<OverviewMetrics> {
  const response = await fetch(`${API_BASE}/analytics/overview`);
  if (!response.ok) {
    throw new Error('Failed to fetch overview metrics');
  }
  return response.json();
}

async function fetchCostAnalysis(): Promise<CostAnalysis> {
  const response = await fetch(`${API_BASE}/analytics/costs`);
  if (!response.ok) {
    throw new Error('Failed to fetch cost analysis');
  }
  return response.json();
}

async function fetchDailyUsageTimeSeries(): Promise<DailyUsageTimeSeries> {
  const response = await fetch(`${API_BASE}/analytics/daily-usage`);
  if (!response.ok) {
    throw new Error('Failed to fetch daily usage time series');
  }
  return response.json();
}

async function fetchDistributionData(): Promise<DistributionData> {
  const response = await fetch(`${API_BASE}/analytics/distributions`);
  if (!response.ok) {
    throw new Error('Failed to fetch distribution data');
  }
  return response.json();
}

async function fetchHeatmapData(): Promise<HeatmapData[]> {
  const response = await fetch(`${API_BASE}/analytics/heatmap`);
  if (!response.ok) {
    throw new Error('Failed to fetch heatmap data');
  }
  return response.json();
}

async function fetchPerformanceMetrics(): Promise<PerformanceMetrics> {
  const response = await fetch(`${API_BASE}/analytics/performance`);
  if (!response.ok) {
    throw new Error('Failed to fetch performance metrics');
  }
  return response.json();
}

// React Query hooks
export function useOverviewMetrics() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: fetchOverviewMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCostAnalysis() {
  return useQuery({
    queryKey: ['analytics', 'costs'],
    queryFn: fetchCostAnalysis,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useDailyUsageTimeSeries() {
  return useQuery({
    queryKey: ['analytics', 'daily-usage'],
    queryFn: fetchDailyUsageTimeSeries,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useDistributionData() {
  return useQuery({
    queryKey: ['analytics', 'distributions'],
    queryFn: fetchDistributionData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useHeatmapData() {
  return useQuery({
    queryKey: ['analytics', 'heatmap'],
    queryFn: fetchHeatmapData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function usePerformanceMetrics() {
  return useQuery({
    queryKey: ['analytics', 'performance'],
    queryFn: fetchPerformanceMetrics,
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