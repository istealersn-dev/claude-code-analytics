import { useMemo } from 'react';

interface HeatmapData {
  hour: number;
  day: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  height?: number;
  formatValue?: (value: number) => string;
  colorScale?: string[];
  showLabels?: boolean;
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
}: HeatmapChartProps) {
  
  const { heatmapData, maxValue } = useMemo(() => {
    // Create a map for quick lookup
    const dataMap = new Map<string, number>();
    let max = 0;
    
    data.forEach(item => {
      const key = `${item.day}-${item.hour}`;
      dataMap.set(key, item.value);
      max = Math.max(max, item.value);
    });
    
    // Create complete grid
    const grid: Array<Array<{ value: number; key: string }>> = DAYS.map(day =>
      HOURS.map(hour => ({
        value: dataMap.get(`${day}-${hour}`) || 0,
        key: `${day}-${hour}`
      }))
    );
    
    return { heatmapData: grid, maxValue: max };
  }, [data]);
  
  const getColor = (value: number): string => {
    if (value === 0 || maxValue === 0) return colorScale[0];
    
    const intensity = value / maxValue;
    const index = Math.min(
      Math.floor(intensity * (colorScale.length - 1)), 
      colorScale.length - 1
    );
    
    return colorScale[index];
  };
  
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
  
  const cellWidth = 32;
  const cellHeight = 20;
  const labelHeight = 20;
  const labelWidth = 40;
  
  return (
    <div style={{ height }} className="overflow-auto">
      <div className="min-w-fit">
        <svg
          width={labelWidth + HOURS.length * cellWidth + 10}
          height={labelHeight + DAYS.length * cellHeight + 10}
          className="font-mono text-xs"
        >
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
                      fill={cell.value > maxValue * 0.6 ? "#FFFFFF" : "#374151"}
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
            {colorScale.map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}