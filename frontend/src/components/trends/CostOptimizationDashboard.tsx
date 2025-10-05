import { Card } from '../ui/Card';
import { useCostOptimizationInsights } from '../../hooks/useTrends';
import { ModelEfficiencyChart } from './ModelEfficiencyChart';
import { BudgetTrackingCard } from './BudgetTrackingCard';
import { OptimizationRecommendations } from './OptimizationRecommendations';
import type { AnalyticsFilters } from '../../hooks/useTrends';

interface CostOptimizationDashboardProps {
  filters?: AnalyticsFilters;
}

export function CostOptimizationDashboard({ filters = {} }: CostOptimizationDashboardProps) {
  const { data: optimizationData, isLoading, error } = useCostOptimizationInsights(filters);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={`loading-${i}`} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <p className="text-lg font-medium mb-2">Error loading cost optimization insights</p>
          <p className="text-sm text-gray-500">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </Card>
    );
  }

  if (!optimizationData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No optimization data available</p>
          <p className="text-sm">Try adjusting your date range or filters</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Cost Optimization Insights</h2>
        
        {/* Budget Tracking */}
        <div className="mb-6">
          <BudgetTrackingCard budgetData={optimizationData.budgetTracking} />
        </div>

        {/* Model Efficiency and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ModelEfficiencyChart data={optimizationData.costPerOutcomeAnalysis} />
          <OptimizationRecommendations recommendations={optimizationData.modelEfficiencyRecommendations} />
        </div>

        {/* Most Expensive Sessions */}
        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Most Expensive Sessions</h3>
            <span className="text-2xl">💸</span>
          </div>

          {optimizationData.mostExpensiveSessions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No expensive sessions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {optimizationData.mostExpensiveSessions.slice(0, 5).map((session, index) => (
                <div 
                  key={session.session_id} 
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-orange-400">#{index + 1}</span>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {session.project_name || 'Unnamed Project'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(session.started_at).toLocaleDateString()} • 
                          {session.model_name || 'Unknown Model'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      ${session.total_cost_usd.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Intl.NumberFormat().format(session.total_input_tokens + session.total_output_tokens)} tokens
                    </div>
                  </div>
                </div>
              ))}
              
              {optimizationData.mostExpensiveSessions.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-400">
                    +{optimizationData.mostExpensiveSessions.length - 5} more sessions
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
