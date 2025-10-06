import { createFileRoute } from '@tanstack/react-router';
import {
  Activity,
  BarChart2,
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Gauge,
  Hash,
  PieChart as PieChartIcon,
  Target,
  Thermometer,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';
import { StatsCard } from '../components/analytics/StatsCard';
import {
  AreaChart,
  BarChart,
  HeatmapChart,
  LineChart,
  PieChart,
} from '../components/charts/LazyCharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import {
  formatCurrency,
  formatDuration,
  formatNumber,
  useCostAnalysis,
  useDailyUsageTimeSeries,
  useDistributionData,
  useHeatmapData,
  useOverviewMetrics,
  usePerformanceMetrics,
} from '../hooks/useAnalytics';
import { getChartHeight, useScreenSize } from '../hooks/useScreenSize';
import { getProjectDisplayName } from '../utils/projectNames';

const dashboardSearchSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const Route = createFileRoute('/')({
  component: Dashboard,
  validateSearch: dashboardSearchSchema,
});

function Dashboard() {
  const { startDate, endDate } = Route.useSearch();
  const navigate = Route.useNavigate();
  const screenSize = useScreenSize();

  const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;

  // Memoized handler for chart clicks - navigate to sessions with date filter
  const handleChartClick = useCallback(
    (dataPoint: { date: string }) => {
      console.log('Chart clicked with data:', dataPoint);

      // Convert YYYY-MM-DD to full UTC day range to capture all sessions for that date
      const startOfDay = `${dataPoint.date}T00:00:00.000Z`;
      const endOfDay = `${dataPoint.date}T23:59:59.999Z`;

      console.log('Navigating to sessions with dateFrom:', startOfDay, 'dateTo:', endOfDay);

      navigate({
        to: '/sessions',
        search: {
          dateFrom: startOfDay,
          dateTo: endOfDay,
        },
      });
    },
    [navigate],
  );

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useOverviewMetrics(dateRange);
  const { data: costAnalysis, isLoading: costsLoading } = useCostAnalysis(dateRange);
  const { data: dailyUsage, isLoading: usageLoading } = useDailyUsageTimeSeries(dateRange);
  const { data: distributions, isLoading: distributionsLoading } = useDistributionData(dateRange);
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmapData(dateRange);
  const { data: performance, isLoading: performanceLoading } = usePerformanceMetrics(dateRange);

  // Memoized processed project data to prevent unnecessary recalculations
  const processedProjectUsage = useMemo(
    () =>
      overview?.topProjects?.map((project) => ({
        name: getProjectDisplayName(project.project_name || 'Unknown', 'legend'),
        value: project.count || 0,
        tooltip: getProjectDisplayName(project.project_name || 'Unknown', 'tooltip'),
      })) || [],
    [overview?.topProjects],
  );

  // Memoized chart data to prevent unnecessary array operations
  const chartData = useMemo(
    () => ({
      dailyCosts: costAnalysis?.dailyCosts?.slice(-30) || [],
      dailySessions: dailyUsage?.sessions?.slice(-30) || [],
      dailyTokens: dailyUsage?.tokens?.slice(-30) || [],
      sessionDuration: dailyUsage?.duration?.slice(-30) || [],
    }),
    [costAnalysis?.dailyCosts, dailyUsage?.sessions, dailyUsage?.tokens, dailyUsage?.duration],
  );

  const handleDateRangeChange = useCallback(
    (range: { start: string; end: string } | undefined) => {
      navigate({
        search: (prev) => ({
          ...prev,
          startDate: range?.start,
          endDate: range?.end,
        }),
      });
    },
    [navigate],
  );

  if (overviewError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Connection Error</h2>
          <p className="text-red-300 mb-4">
            Unable to connect to the analytics API. Make sure the backend server is running on port
            3001.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Claude Code Analytics
              </h1>
              <p className="text-sm sm:text-base text-gray-400">
                Track your Claude Code usage patterns, costs, and productivity metrics
              </p>
            </div>
            <div className="flex-shrink-0">
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatsCard
          title="Total Sessions"
          value={overview?.totalSessions || 0}
          subtitle="All time"
          icon={BarChart3}
          loading={overviewLoading}
        />
        <StatsCard
          title="Total Cost"
          value={overview ? formatCurrency(overview.totalCost) : '$0.00'}
          subtitle="All time"
          icon={DollarSign}
          loading={overviewLoading}
        />
        <StatsCard
          title="Token Usage"
          value={
            overview ? formatNumber(overview.totalInputTokens + overview.totalOutputTokens) : '0'
          }
          subtitle={`${formatNumber(overview?.totalInputTokens || 0)} in, ${formatNumber(overview?.totalOutputTokens || 0)} out`}
          icon={Target}
          loading={overviewLoading}
        />
        <StatsCard
          title="Avg Session"
          value={overview ? `${Math.round(overview.averageSessionDuration / 60)}min` : '0min'}
          subtitle="Duration"
          icon={Zap}
          loading={overviewLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Daily Cost Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Daily Cost Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <AreaChart
                data={chartData.dailyCosts}
                height={getChartHeight(screenSize)}
                color="#FF6B35"
                formatValue={formatCurrency}
                formatTooltip={(value) => [formatCurrency(value), 'Cost']}
              />
            )}
          </CardContent>
        </Card>

        {/* Top Models */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              Top Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between items-center mb-2">
                      <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-600 rounded w-16"></div>
                    </div>
                    <div className="h-2 bg-gray-700 rounded">
                      <div
                        className="h-2 bg-gray-600 rounded"
                        style={{ width: `${Math.random() * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {overview?.topModels?.slice(0, 5).map((model, index) => (
                  <div key={`${model.model}-${index}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-white">{model.model}</span>
                      <span className="text-sm text-gray-400">{model.count} sessions</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-primary-500 to-primary-400 rounded transition-all duration-500"
                        style={{ width: `${model.percentage}%` }}
                      />
                    </div>
                  </div>
                )) || <p className="text-gray-400 text-center py-8">No model data available</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Phase 3: Time-Series Charts */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Usage Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Daily Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-500" />
                  Daily Sessions
                </div>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                  Click to filter sessions
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <LineChart
                  data={chartData.dailySessions}
                  height={getChartHeight(screenSize)}
                  color="#3B82F6"
                  formatValue={formatNumber}
                  onDataPointClick={handleChartClick}
                  formatTooltip={(value) => [`${formatNumber(value)} sessions`, 'Sessions']}
                />
              )}
            </CardContent>
          </Card>

          {/* Daily Token Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-primary-500" />
                  Token Usage
                </div>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                  Click to filter sessions
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <LineChart
                  data={chartData.dailyTokens}
                  height={250}
                  color="#10B981"
                  formatValue={formatNumber}
                  onDataPointClick={handleChartClick}
                  formatTooltip={(value) => [`${formatNumber(value)} tokens`, 'Tokens']}
                />
              )}
            </CardContent>
          </Card>

          {/* Average Session Duration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  Avg Session Duration
                </div>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                  Click to filter sessions
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <LineChart
                  data={chartData.sessionDuration}
                  height={250}
                  color="#8B5CF6"
                  formatValue={formatDuration}
                  onDataPointClick={handleChartClick}
                  formatTooltip={(value) => [`${formatDuration(value)} avg`, 'Duration']}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Phase 3.2: Distribution Charts */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
          Usage Distributions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Model Usage Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-primary-500" />
                Model Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {distributionsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <PieChart data={distributions?.modelUsage || []} height={250} showLabels={true} />
              )}
            </CardContent>
          </Card>

          {/* Tool Usage Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary-500" />
                Tool Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {distributionsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <BarChart
                  data={distributions?.toolUsage || []}
                  height={250}
                  color="#10B981"
                  showTooltip={true}
                />
              )}
            </CardContent>
          </Card>

          {/* Project Usage Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-primary-500" />
                Project Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {distributionsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <PieChart
                  data={processedProjectUsage}
                  height={250}
                  showLabels={true}
                  formatTooltip={(value, name, percentage) => [
                    `${value} sessions (${percentage.toFixed(1)}%)`,
                    processedProjectUsage.find((p) => p.name === name)?.tooltip || name,
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Phase 3.3: Performance Metrics */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
          Performance Insights
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Usage Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-primary-500" />
                Usage Heatmap (Hour of Day)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {heatmapLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <HeatmapChart
                  data={heatmapData || []}
                  height={300}
                  formatValue={(value) => value.toString()}
                  showLabels={true}
                />
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary-500" />
                Performance Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : performance ? (
                <div className="space-y-6">
                  {/* Session Length Distribution */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      Session Length Distribution
                    </h4>
                    <div className="space-y-2">
                      {performance.sessionLengthDistribution?.slice(0, 5).map((range, index) => (
                        <div
                          key={`${range.range}-${index}`}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-400">{range.range}</span>
                          <span className="text-sm text-white font-medium">
                            {range.count} sessions
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cache Stats */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Cache Performance</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-primary-400">
                          {performance.cacheStats?.hitRate
                            ? `${Math.round(performance.cacheStats.hitRate * 100)}%`
                            : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400">Hit Rate</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {performance.cacheStats?.totalRequests || 0}
                        </p>
                        <p className="text-xs text-gray-400">Total Requests</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No performance data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Welcome Message or Data Summary */}
      {overview?.totalSessions === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-4">
              Welcome to Claude Code Analytics
            </h2>
            <p className="text-gray-400 mb-6">
              Your dashboard is ready! Connect your Claude Code data to start tracking your usage
              patterns and insights.
            </p>
            <button
              type="button"
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Sync Data
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Most Used Tool</p>
                <p className="text-lg font-semibold text-white">
                  {overview?.topTools?.[0]?.tool || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Most Active Project</p>
                <p className="text-lg font-semibold text-white">
                  {overview?.topProjects?.[0]?.project || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Models Used</p>
                <p className="text-lg font-semibold text-white">
                  {overview?.topModels?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
