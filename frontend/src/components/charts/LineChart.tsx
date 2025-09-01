import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: Array<{ date: string; value: number; count?: number }>;
  height?: number;
  color?: string;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number, count?: number) => [string, string];
  showGrid?: boolean;
}

export function LineChart({
  data,
  height = 300,
  color = '#FF6B35',
  formatValue = (value) => value.toString(),
  formatTooltip = (value, count) => [formatValue?.(value) || value.toString(), 'Value'],
  showGrid = true,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-gray-400"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3} 
            />
          )}
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
            }}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: '#F9FAFB' }}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
            }}
            formatter={(value: number, _name, props) => {
              const count = props.payload?.count;
              return formatTooltip(value, count);
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}