import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../ui/Card';

interface SeasonalPattern {
  month: string;
  sessions: number;
  cost: number;
  tokens: number;
}

interface SeasonalPatternsChartProps {
  data: SeasonalPattern[];
}

export function SeasonalPatternsChart({ data }: SeasonalPatternsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Seasonal Patterns</h3>
        <div className="text-center text-gray-400 py-8">
          <p>No seasonal data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Seasonal Patterns</h3>
        <span className="text-2xl">📅</span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
            <YAxis stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
              formatter={(value: number, name: string) => [
                name === 'cost' ? `$${value.toFixed(2)}` : new Intl.NumberFormat().format(value),
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
            />
            <Line
              type="monotone"
              dataKey="sessions"
              stroke="#FF6B35"
              strokeWidth={2}
              dot={{ fill: '#FF6B35', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#FF6B35', strokeWidth: 2, fill: '#FF6B35' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-300">Sessions</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Peak Month</div>
            <div className="text-sm font-medium text-white">
              {data.reduce((max, curr) => (curr.sessions > max.sessions ? curr : max)).month.trim()}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Total Sessions</div>
            <div className="text-sm font-medium text-white">
              {new Intl.NumberFormat().format(data.reduce((sum, curr) => sum + curr.sessions, 0))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Avg/Month</div>
            <div className="text-sm font-medium text-white">
              {new Intl.NumberFormat().format(
                Math.round(data.reduce((sum, curr) => sum + curr.sessions, 0) / data.length),
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
