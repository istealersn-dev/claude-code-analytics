import { Card } from '../ui/Card';

interface TrendGrowthCardProps {
  title: string;
  current: number;
  previous: number;
  growth: number;
  icon: string;
  format: 'number' | 'currency';
}

export function TrendGrowthCard({
  title,
  current,
  previous,
  growth,
  icon,
  format,
}: TrendGrowthCardProps) {
  const formatValue = (value: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return new Intl.NumberFormat('en-US').format(value);
  };

  const isPositiveGrowth = growth > 0;
  const growthColor = isPositiveGrowth
    ? 'text-green-400'
    : growth < 0
      ? 'text-red-400'
      : 'text-gray-400';
  const growthIcon = isPositiveGrowth ? '↗' : growth < 0 ? '↘' : '→';

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="space-y-2">
        <div className="text-2xl font-bold text-white">{formatValue(current)}</div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Previous: {formatValue(previous)}</span>

          <div className={`flex items-center space-x-1 ${growthColor}`}>
            <span>{growthIcon}</span>
            <span className="font-medium">{Math.abs(growth).toFixed(1)}%</span>
          </div>
        </div>

        {/* Growth visualization bar */}
        <div className="mt-3">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>Growth:</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  isPositiveGrowth
                    ? 'bg-gradient-to-r from-green-600 to-green-400'
                    : growth < 0
                      ? 'bg-gradient-to-r from-red-600 to-red-400'
                      : 'bg-gray-600'
                }`}
                style={{
                  width: `${Math.min(Math.abs(growth), 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
