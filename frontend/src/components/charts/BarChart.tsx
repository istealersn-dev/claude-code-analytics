import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  color?: string;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => [string, string];
  orientation?: 'horizontal' | 'vertical';
  maxBars?: number;
}

export function BarChart({
  data,
  height = 300,
  color = '#FF6B35',
  showGrid = true,
  formatValue = (value) => value.toString(),
  formatTooltip = (value, name) => [formatValue(value), name],
  orientation = 'vertical',
  maxBars = 10,
}: BarChartProps) {
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

  // Limit the number of bars and sort by value (descending)
  const displayData = data
    .sort((a, b) => b.value - a.value)
    .slice(0, maxBars);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart 
          data={displayData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={orientation === 'horizontal' ? 'verseReverse' : 'horizontal'}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3} 
            />
          )}
          
          {orientation === 'vertical' ? (
            <>
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
            </>
          ) : (
            <>
              <XAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
              <YAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={120}
                type="category"
              />
            </>
          )}
          
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              color: '#F9FAFB',
            }}
            formatter={(value: number, _name, props) => {
              const name = props.payload?.name || '';
              return formatTooltip(value, name);
            }}
            labelStyle={{ color: '#F9FAFB' }}
          />
          
          <Bar 
            dataKey="value" 
            fill={color}
            radius={[4, 4, 0, 0]}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}