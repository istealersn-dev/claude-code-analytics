import { memo, useMemo, useRef, useCallback } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export interface PieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number, name: string, percentage: number) => [string, string];
  colors?: string[];
  exportable?: boolean;
  exportFilename?: string;
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

export const PieChart = memo(function PieChart({
  data,
  height = 300,
  showLegend = true,
  showTooltip = true,
  formatValue = (value) => value.toString(),
  formatTooltip = (value, name, percentage) => [
    `${formatValue(value)} (${percentage.toFixed(1)}%)`,
    name,
  ],
  colors = DEFAULT_COLORS,
  exportable,
  exportFilename = 'chart.png',
}: PieChartProps) {
  // Memoize expensive computations
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { dataWithColors: [], total: 0 };

    // Ensure each data item has a color
    const dataWithColors = data.map((item, index) => ({
      ...item,
      color: item.color || colors[index % colors.length],
    }));

    // Calculate total for percentage calculation
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return { dataWithColors, total };
  }, [data, colors]);

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

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <div style={{ height }} className="relative" ref={containerRef}>
      {exportable && (
        <button
          type="button"
          onClick={handleExport}
          className="absolute top-2 right-2 bg-gray-800/70 hover:bg-gray-800 text-white text-xs px-2 py-1 rounded"
        >
          Export PNG
        </button>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={processedData.dataWithColors}
            cx="50%"
            cy="50%"
            innerRadius={showLegend ? 60 : 40}
            outerRadius={showLegend ? 100 : 120}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {processedData.dataWithColors.map((entry, index) => (
              <Cell
                key={`${entry.name}-${index}`}
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
                const percentage = (value / processedData.total) * 100;
                return formatTooltip(value, name, percentage);
              }}
            />
          )}

          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={60}
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px',
                color: '#9CA3AF',
                lineHeight: '1.2',
              }}
              iconType="circle"
              formatter={(value) => (
                <span
                  style={{
                    fontSize: '12px',
                    wordBreak: 'break-word',
                    display: 'inline-block',
                    maxWidth: '150px',
                    lineHeight: '1.3',
                  }}
                >
                  {value}
                </span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
});
