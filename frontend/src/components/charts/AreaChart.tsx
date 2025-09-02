import { Area, AreaChart as RechartsAreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DataPoint {
  date: string;
  value: number;
  count?: number;
}

interface AreaChartProps {
  data: DataPoint[];
  title?: string;
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => [string, string];
  onDataPointClick?: (data: DataPoint) => void;
}

export function AreaChart({ 
  data, 
  title, 
  color = '#FF6B35', 
  height = 300,
  formatValue,
  formatTooltip,
  onDataPointClick
}: AreaChartProps) {
  const defaultFormatValue = (value: number) => value.toLocaleString();
  const valueFormatter = formatValue || defaultFormatValue;

  const defaultFormatTooltip = (value: number, name: string) => [
    valueFormatter(value),
    name
  ];
  const tooltipFormatter = formatTooltip || defaultFormatTooltip;

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart 
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          onClick={onDataPointClick ? (data) => {
            if (data && data.activePayload && data.activePayload.length > 0) {
              onDataPointClick(data.activePayload[0].payload);
            }
          } : undefined}
          style={onDataPointClick ? { cursor: 'pointer' } : undefined}
        >
          <defs>
            <linearGradient id={`area-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => {
              try {
                return new Date(value).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });
              } catch {
                return value;
              }
            }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#FFFFFF'
            }}
            formatter={tooltipFormatter}
            labelFormatter={(label) => {
              try {
                return new Date(label).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short', 
                  day: 'numeric' 
                });
              } catch {
                return label;
              }
            }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            fill={`url(#area-gradient-${color.replace('#', '')})`}
            dot={{ r: 0 }}
            activeDot={{ r: 4, fill: color }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}