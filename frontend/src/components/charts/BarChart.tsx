import {
  Bar,
  CartesianGrid,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCallback, useRef } from 'react';

export interface BarChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  color?: string;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => [string, string];
  orientation?: 'horizontal' | 'vertical';
  maxBars?: number;
  exportable?: boolean;
  exportFilename?: string;
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
  exportable,
  exportFilename = 'chart.png',
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height }}>
        No data available
      </div>
    );
  }

  // Limit the number of bars and sort by value (descending)
  const displayData = data.sort((a, b) => b.value - a.value).slice(0, maxBars);

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
        <RechartsBarChart
          data={displayData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />}

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
