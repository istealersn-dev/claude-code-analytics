import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Anomaly {
  date: string;
  type: 'sessions' | 'cost' | 'tokens';
  value: number;
  expectedValue: number;
  deviation: number;
}

interface AnomalyDetectionChartProps {
  data: Anomaly[];
}

export function AnomalyDetectionChart({ data }: AnomalyDetectionChartProps) {
  const mostCommonAnomalyType = useMemo(() => {
    if (!data || data.length === 0) return 'None';
    
    const counts = data.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Anomaly Detection</h3>
        <div className="text-center text-gray-400 py-8">
          <p>No anomalies detected</p>
          <p className="text-sm mt-2">Your usage patterns are consistent</p>
        </div>
      </Card>
    );
  }

  const getColorByType = (type: string) => {
    switch (type) {
      case 'sessions': return '#FF6B35';
      case 'cost': return '#EF4444';
      case 'tokens': return '#10B981';
      default: return '#6B7280';
    }
  };

  // Transform data for scatter plot
  const scatterData = data.map((anomaly, index) => ({
    x: new Date(anomaly.date).getTime(),
    y: anomaly.deviation,
    date: anomaly.date,
    type: anomaly.type,
    value: anomaly.value,
    expectedValue: anomaly.expectedValue,
    deviation: anomaly.deviation,
    color: getColorByType(anomaly.type),
  }));

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Anomaly Detection</h3>
        <span className="text-2xl">🚨</span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              type="number"
              dataKey="x"
              scale="time"
              domain={['dataMin', 'dataMax']}
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              label={{ value: 'Deviation', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
              formatter={(value: number, name: string, props: any) => {
                const { payload } = props;
                return [
                  [
                    `Date: ${new Date(payload.date).toLocaleDateString()}`,
                    `Type: ${payload.type}`,
                    `Value: ${payload.value.toFixed(2)}`,
                    `Expected: ${payload.expectedValue.toFixed(2)}`,
                    `Deviation: ${payload.deviation.toFixed(2)}σ`,
                  ].join('\n'),
                  'Anomaly Details'
                ];
              }}
            />
            <Scatter data={scatterData}>
              {scatterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-300">Sessions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-300">Cost</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-300">Tokens</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Total Anomalies</div>
            <div className="text-sm font-medium text-white">{data.length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Most Common</div>
            <div className="text-sm font-medium text-white">
              {mostCommonAnomalyType}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Max Deviation</div>
            <div className="text-sm font-medium text-white">
              {data.length > 0 ? `${Math.max(...data.map(d => d.deviation)).toFixed(1)}σ` : '0σ'}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
