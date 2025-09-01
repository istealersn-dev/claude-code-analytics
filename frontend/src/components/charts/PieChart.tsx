import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number, name: string, percentage: number) => [string, string];
  colors?: string[];
}

// Default color palette for pie charts
const DEFAULT_COLORS = [
  '#FF6B35', // Primary orange
  '#4ECDC4', // Teal
  '#45B7D1', // Blue  
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Purple
  '#FF7675', // Red
  '#74B9FF', // Light blue
  '#A29BFE', // Lavender
  '#6C5CE7', // Violet
  '#FD79A8', // Pink
  '#FDCB6E', // Orange
];

export function PieChart({
  data,
  height = 300,
  showLegend = true,
  showTooltip = true,
  formatValue = (value) => value.toString(),
  formatTooltip = (value, name, percentage) => [
    `${formatValue(value)} (${percentage.toFixed(1)}%)`, 
    name
  ],
  colors = DEFAULT_COLORS,
}: PieChartProps) {
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

  // Ensure each data item has a color
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }));

  // Calculate total for percentage calculation
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            innerRadius={showLegend ? 60 : 40}
            outerRadius={showLegend ? 100 : 120}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {dataWithColors.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
            ))}
          </Pie>
          
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                color: '#F9FAFB',
              }}
              formatter={(value: number, name: string) => {
                const percentage = (value / total) * 100;
                return formatTooltip(value, name, percentage);
              }}
            />
          )}
          
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
                color: '#9CA3AF',
              }}
              iconType="circle"
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}