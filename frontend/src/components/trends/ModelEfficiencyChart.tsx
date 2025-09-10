import React from 'react';
import { Card } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ModelEfficiency {
  model: string;
  avgCostPerSession: number;
  avgTokensPerSession: number;
  efficiency: number;
}

interface ModelEfficiencyChartProps {
  data: ModelEfficiency[];
}

export function ModelEfficiencyChart({ data }: ModelEfficiencyChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Model Efficiency</h3>
        <div className="text-center text-gray-400 py-8">
          <p>No model efficiency data available</p>
        </div>
      </Card>
    );
  }

  // Sort by efficiency descending
  const sortedData = [...data].sort((a, b) => b.efficiency - a.efficiency);

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Model Efficiency</h3>
        <span className="text-2xl">⚡</span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="model" 
              stroke="#9CA3AF"
              fontSize={11}
              tick={{ fill: '#9CA3AF' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              label={{ value: 'Tokens per Dollar', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value.toFixed(0)} tokens/$`,
                'Efficiency'
              ]}
              labelFormatter={(label: string) => `Model: ${label}`}
              itemStyle={{ color: '#F9FAFB' }}
            />
            <Bar 
              dataKey="efficiency" 
              fill="#FF6B35"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Most Efficient</div>
            <div className="text-sm font-medium text-white">
              {sortedData[0]?.model || 'N/A'}
            </div>
            <div className="text-xs text-green-400">
              {sortedData[0]?.efficiency.toFixed(0)} tokens/$
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Least Efficient</div>
            <div className="text-sm font-medium text-white">
              {sortedData[sortedData.length - 1]?.model || 'N/A'}
            </div>
            <div className="text-xs text-red-400">
              {sortedData[sortedData.length - 1]?.efficiency.toFixed(0)} tokens/$
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}