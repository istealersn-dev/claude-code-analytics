import { useMemo, useRef, useCallback } from 'react';

interface HeatmapData {
  hour: number;
  day: string;
  value: number;
}

export interface HeatmapChartProps {
  data: HeatmapData[];
  height?: number;
  formatValue?: (value: number) => string;
  colorScale?: string[];
  showLabels?: boolean;
  exportable?: boolean;
  exportFilename?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Default color scale from light to dark
const DEFAULT_COLOR_SCALE = [
  '#FEF3E2', // Very light orange
  '#FDEBA6', // Light orange
  '#FBDF8A', // Medium light orange
  '#F9D071', // Medium orange
  '#F7C05A', // Medium dark orange
  '#FF6B35', // Primary orange
  '#E55A2B', // Dark orange
  '#CC4A21', // Very dark orange
];

export function HeatmapChart({
  data,
  height = 300,
  formatValue = (value) => value.toString(),
  colorScale = DEFAULT_COLOR_SCALE,
  showLabels = true,
  exportable,
  exportFilename = 'chart.png',
}: HeatmapChartProps) {
  const { heatmapData, maxValue } = useMemo(() => {
    // Create a map for quick lookup
    const dataMap = new Map<string, number>();
    let max = 0;

    data.forEach((item) => {
      const key = `${item.day}-${item.hour}`;
      dataMap.set(key, item.value);
      max = Math.max(max, item.value);
    });

    // Create complete grid
    const grid: Array<Array<{ value: number; key: string }>> = DAYS.map((day) =>
      HOURS.map((hour) => ({
        value: dataMap.get(`${day}-${hour}`) || 0,
        key: `${day}-${hour}`,
      })),
    );

    return { heatmapData: grid, maxValue: max };
  }, [data]);

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

  const getColor = (value: number): string => {
    if (value === 0 || maxValue === 0) return colorScale[0];

    const intensity = value / maxValue;
    const index = Math.min(Math.floor(intensity * (colorScale.length - 1)), colorScale.length - 1);

    return colorScale[index];
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height }}>
        No data available
      </div>
    );
  }

  const cellWidth = 32;
  const cellHeight = 20;
  const labelHeight = 20;
  const labelWidth = 40;

  return (
    <div style={{ height }} className="overflow-auto relative" ref={containerRef}>
      {exportable && (
        <button
          type="button"
          onClick={handleExport}
          className="absolute top-2 right-2 bg-gray-800/70 hover:bg-gray-800 text-white text-xs px-2 py-1 rounded"
        >
          Export PNG
        </button>
      )}
      <div className="min-w-fit">
        <svg
          width={labelWidth + HOURS.length * cellWidth + 10}
          height={labelHeight + DAYS.length * cellHeight + 10}
          className="font-mono text-xs"
          role="img"
          aria-label="Heatmap showing activity by day and hour"
        >
          <title>Activity Heatmap</title>
          {/* Hour labels */}
          {HOURS.map((hour, hourIndex) => (
            <text
              key={`hour-${hour}`}
              x={labelWidth + hourIndex * cellWidth + cellWidth / 2}
              y={labelHeight - 5}
              textAnchor="middle"
              fill="#9CA3AF"
              fontSize="10"
            >
              {hour}
            </text>
          ))}

          {/* Day labels and heatmap cells */}
          {DAYS.map((day, dayIndex) => (
            <g key={`day-${day}`}>
              <text
                x={labelWidth - 5}
                y={labelHeight + dayIndex * cellHeight + cellHeight / 2 + 3}
                textAnchor="end"
                fill="#9CA3AF"
                fontSize="10"
              >
                {day}
              </text>

              {heatmapData[dayIndex].map((cell, hourIndex) => (
                <g key={cell.key}>
                  <rect
                    x={labelWidth + hourIndex * cellWidth + 1}
                    y={labelHeight + dayIndex * cellHeight + 1}
                    width={cellWidth - 2}
                    height={cellHeight - 2}
                    fill={getColor(cell.value)}
                    stroke="#374151"
                    strokeWidth="0.5"
                    rx="2"
                    className="hover:stroke-white hover:stroke-2 transition-all cursor-pointer"
                  >
                    <title>
                      {day} {hourIndex}:00 - {formatValue(cell.value)}
                    </title>
                  </rect>

                  {showLabels && cell.value > 0 && cell.value > maxValue * 0.3 && (
                    <text
                      x={labelWidth + hourIndex * cellWidth + cellWidth / 2}
                      y={labelHeight + dayIndex * cellHeight + cellHeight / 2 + 3}
                      textAnchor="middle"
                      fill={cell.value > maxValue * 0.6 ? '#FFFFFF' : '#374151'}
                      fontSize="8"
                      fontWeight="500"
                    >
                      {cell.value}
                    </text>
                  )}
                </g>
              ))}
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
          <span>Low</span>
          <div className="flex gap-1">
            {colorScale.map((color) => (
              <div key={color} className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
