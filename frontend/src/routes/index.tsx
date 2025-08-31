import { createFileRoute } from '@tanstack/react-router';
import { useOverviewMetrics, useCostAnalysis, formatCurrency, formatNumber } from '../hooks/useAnalytics';
import { StatsCard } from '../components/analytics/StatsCard';
import { AreaChart } from '../components/charts/AreaChart';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  BarChart3, 
  DollarSign, 
  Zap, 
  Target,
  TrendingUp,
  Calendar
} from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useOverviewMetrics();
  const { data: costAnalysis, isLoading: costsLoading } = useCostAnalysis();

  // Calculate cache hit rate
  const cacheHitRate = overview ? 
    ((overview.totalInputTokens + overview.totalOutputTokens) > 0 ? 
      (overview.totalInputTokens / (overview.totalInputTokens + overview.totalOutputTokens) * 100) : 0) 
    : 0;

  if (overviewError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">
            Connection Error
          </h2>
          <p className="text-red-300 mb-4">
            Unable to connect to the analytics API. Make sure the backend server is running on port 3001.
          </p>
          <button 
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Claude Code Analytics Dashboard
        </h1>
        <p className="text-gray-400">
          Track your Claude Code usage patterns, costs, and productivity metrics
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          value={overview ? formatNumber((overview.totalInputTokens + overview.totalOutputTokens)) : '0'}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                data={costAnalysis?.dailyCosts?.slice(-30) || []}
                height={250}
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
                      <div className="h-2 bg-gray-600 rounded" style={{ width: `${Math.random() * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {overview?.topModels?.slice(0, 5).map((model, index) => (
                  <div key={model.model}>
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
                )) || (
                  <p className="text-gray-400 text-center py-8">No model data available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Welcome Message or Data Summary */}
      {overview?.totalSessions === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-4">
              Welcome to Claude Code Analytics
            </h2>
            <p className="text-gray-400 mb-6">
              Your dashboard is ready! Connect your Claude Code data to start tracking your usage patterns and insights.
            </p>
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
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
  )
}