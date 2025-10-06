import { Card } from '../ui/Card';

interface Recommendation {
  currentModel: string;
  recommendedModel: string;
  potentialSavings: number;
  reason: string;
}

interface OptimizationRecommendationsProps {
  recommendations: Recommendation[];
}

export function OptimizationRecommendations({ recommendations }: OptimizationRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Optimization Recommendations</h3>
          <span className="text-2xl">💡</span>
        </div>

        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-4">🎉</div>
          <p className="text-sm font-medium">Great job!</p>
          <p className="text-xs mt-2">
            Your current model usage is already optimized. No recommendations at this time.
          </p>
        </div>
      </Card>
    );
  }

  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Optimization Recommendations</h3>
        <span className="text-2xl">💡</span>
      </div>

      <div className="space-y-4">
        {/* Total Savings Potential */}
        <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-400 font-medium">Potential Monthly Savings</div>
              <div className="text-xs text-gray-400 mt-1">Based on average session frequency</div>
            </div>
            <div className="text-2xl font-bold text-green-400">
              ${totalPotentialSavings.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Individual Recommendations */}
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div key={`${rec.currentModel}-${rec.recommendedModel}`} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs font-medium text-orange-400">SWITCH</span>
                    <span className="text-sm text-gray-400">→</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-red-400 font-medium">{rec.currentModel}</span>
                    <span className="text-gray-400 mx-2">→</span>
                    <span className="text-green-400 font-medium">{rec.recommendedModel}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    +${rec.potentialSavings.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">per session</div>
                </div>
              </div>

              <div className="text-xs text-gray-400 leading-relaxed">{rec.reason}</div>

              {/* Action Button */}
              <div className="mt-3 pt-3 border-t border-gray-700">
                <button type="button"
                  onClick={() =>
                    window.open(`https://docs.anthropic.com/claude/docs/models-overview`, '_blank')
                  }
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors duration-200"
                >
                  Learn more about {rec.recommendedModel} →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Tips */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <div className="font-medium mb-2">💡 Additional Cost Optimization Tips:</div>
            <ul className="space-y-1 text-xs">
              <li>• Use shorter prompts when possible to reduce input token costs</li>
              <li>• Consider batching similar requests to improve efficiency</li>
              <li>• Monitor your most expensive sessions for optimization opportunities</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}
