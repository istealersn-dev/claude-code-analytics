import {
  Area,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCallback, useRef } from 'react';

interface DataPoint {
  date: string;
  value: number;
  count?: number;
}

export interface AreaChartProps {
  data: DataPoint[];
  title?: string;
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => [string, string];
  onDataPointClick?: (data: DataPoint) => void;
  exportable?: boolean;
  exportFilename?: string;
}

export function AreaChart({
  data,
  title,
  color = '#FF6B35',
  height = 300,
  formatValue,
  formatTooltip,
  onDataPointClick,
  exportable,
  exportFilename = 'chart.png',
}: AreaChartProps) {
  const defaultFormatValue = (value: number) => value.toLocaleString();
  const valueFormatter = formatValue || defaultFormatValue;

  const defaultFormatTooltip = (value: number, name: string) => [valueFormatter(value), name];
  const tooltipFormatter = formatTooltip || defaultFormatTooltip;

  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const svg = root.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    const rect = svg.getBoundingClientRect();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(rect.width));
      canvas.height = Math.max(1, Math.round(rect.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = exportFilename;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [exportFilename]);

  return (
    <div className="w-full relative" ref={containerRef}>
      {exportable && (
        <button
          type="button"
          onClick={handleExport}
          className="absolute top-2 right-2 bg-gray-800/70 hover:bg-gray-800 text-white text-xs px-2 py-1 rounded"
        >
          Export PNG
        </button>
      )}
      {title && <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          onClick={
            onDataPointClick
              ? (event) => {
                  const chartEvent = event as {
                    activePayload?: Array<{ payload: DataPoint }>;
                  };

                  const payload = chartEvent.activePayload?.[0]?.payload;
                  if (payload) {
                    onDataPointClick(payload);
                  }
                }
              : undefined
          }
          style={onDataPointClick ? { cursor: 'pointer' } : undefined}
        >
          <defs>
            <linearGradient
              id={`area-gradient-${color.replace('#', '')}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
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
                  day: 'numeric',
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
              color: '#FFFFFF',
            }}
            formatter={tooltipFormatter}
            labelFormatter={(label) => {
              try {
                return new Date(label).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
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
