import type { AnalyticsFilters } from '../../hooks/useTrends';
import { useTrendAnalysis } from '../../hooks/useTrends';
import { Card } from '../ui/Card';
import { AnomalyDetectionChart } from './AnomalyDetectionChart';
import { SeasonalPatternsChart } from './SeasonalPatternsChart';
import { TrendGrowthCard } from './TrendGrowthCard';

interface TrendAnalysisDashboardProps {
  filters?: AnalyticsFilters;
}

export function TrendAnalysisDashboard({ filters = {} }: TrendAnalysisDashboardProps) {
  const { data: trendData, isLoading, error } = useTrendAnalysis(filters);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton loaders don't change order
            <Card key={`loading-${i}`} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium mb-2">Error loading trend analysis</p>
          <p className="text-sm text-gray-500">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </Card>
    );
  }

  if (!trendData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No trend data available</p>
          <p className="text-sm">Try adjusting your date range or filters</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Growth Metrics */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Trend Analysis</h2>

        {/* Week over Week Growth */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Week over Week Growth</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TrendGrowthCard
              title="Sessions"
              current={trendData.weekOverWeekGrowth.sessions.current}
              previous={trendData.weekOverWeekGrowth.sessions.previous}
              growth={trendData.weekOverWeekGrowth.sessions.growth}
              icon="📊"
              format="number"
            />
            <TrendGrowthCard
              title="Cost"
              current={trendData.weekOverWeekGrowth.cost.current}
              previous={trendData.weekOverWeekGrowth.cost.previous}
              growth={trendData.weekOverWeekGrowth.cost.growth}
              icon="💰"
              format="currency"
            />
            <TrendGrowthCard
              title="Tokens"
              current={trendData.weekOverWeekGrowth.tokens.current}
              previous={trendData.weekOverWeekGrowth.tokens.previous}
              growth={trendData.weekOverWeekGrowth.tokens.growth}
              icon="🔤"
              format="number"
            />
          </div>
        </div>

        {/* Month over Month Growth */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Month over Month Growth</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TrendGrowthCard
              title="Sessions"
              current={trendData.monthOverMonthGrowth.sessions.current}
              previous={trendData.monthOverMonthGrowth.sessions.previous}
              growth={trendData.monthOverMonthGrowth.sessions.growth}
              icon="📊"
              format="number"
            />
            <TrendGrowthCard
              title="Cost"
              current={trendData.monthOverMonthGrowth.cost.current}
              previous={trendData.monthOverMonthGrowth.cost.previous}
              growth={trendData.monthOverMonthGrowth.cost.growth}
              icon="💰"
              format="currency"
            />
            <TrendGrowthCard
              title="Tokens"
              current={trendData.monthOverMonthGrowth.tokens.current}
              previous={trendData.monthOverMonthGrowth.tokens.previous}
              growth={trendData.monthOverMonthGrowth.tokens.growth}
              icon="🔤"
              format="number"
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SeasonalPatternsChart data={trendData.seasonalPatterns} />
        <AnomalyDetectionChart data={trendData.anomalyDetection} />
      </div>
    </div>
  );
}
