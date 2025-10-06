import { memo, useCallback, useMemo } from 'react';
import type { MouseEvent } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartMouseEvent {
  activePayload?: Array<{ payload: { date: string; value: number; count?: number } }>;
}

export interface LineChartProps {
  data: Array<{ date: string; value: number; count?: number }>;
  height?: number;
  color?: string;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number) => [string, string];
  showGrid?: boolean;
  onDataPointClick?: (data: { date: string; value: number; count?: number }) => void;
}

export const LineChart = memo(function LineChart({
  data,
  height = 300,
  color = '#FF6B35',
  formatValue = (value) => value.toString(),
  formatTooltip = (value) => [formatValue?.(value) || value.toString(), 'Value'],
  showGrid = true,
  onDataPointClick,
}: LineChartProps) {
  // Memoize expensive computations
  const chartMargin = useMemo(() => ({ top: 5, right: 30, left: 20, bottom: 5 }), []);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!onDataPointClick || !data || data.length === 0) return;

      console.log('Chart overlay clicked - processing click...');
      event.preventDefault();
      event.stopPropagation();

      // Calculate which data point is closest to the click position
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const chartWidth = rect.width - 40 - 30; // Account for margins (left: 20, right: 30)
      const dataPointIndex = Math.round(((clickX - 20) / chartWidth) * (data.length - 1));
      const clampedIndex = Math.max(0, Math.min(data.length - 1, dataPointIndex));

      const selectedDataPoint = data[clampedIndex];
      console.log('Selected data point:', selectedDataPoint);

      onDataPointClick(selectedDataPoint);
    },
    [onDataPointClick, data],
  );

  const handleChartClick = useCallback(
    (clickData: ChartMouseEvent | null) => {
      if (!onDataPointClick) return;
      console.log('LineChart onClick triggered:', clickData);
      if (clickData?.activePayload && clickData.activePayload.length > 0) {
        console.log('Calling onDataPointClick with:', clickData.activePayload[0].payload);
        onDataPointClick(clickData.activePayload[0].payload);
      }
    },
    [onDataPointClick],
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <div
      style={{ height, position: 'relative' }}
      className={onDataPointClick ? 'cursor-pointer' : ''}
    >
      {/* Clickable overlay if onClick handler is provided */}
      {onDataPointClick && (
        // biome-ignore lint/a11y/useSemanticElements: This is an overlay element, not a traditional button
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOverlayClick(e as unknown as MouseEvent<HTMLDivElement>);
            }
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 107, 53, 0.05)', // Very subtle orange tint to show clickable area
            border: '1px solid rgba(255, 107, 53, 0.2)', // Subtle border to show boundaries
          }}
          onClick={handleOverlayClick}
          aria-label="Click anywhere on the chart to view sessions for that time period"
        />
      )}

      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={chartMargin}
          onClick={onDataPointClick ? handleChartClick : undefined}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />}
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
                day: 'numeric',
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
            formatter={(value: number) => {
              return formatTooltip(value);
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={
              onDataPointClick
                ? {
                    fill: color,
                    strokeWidth: 2,
                    r: 4,
                    onClick: (data) => {
                      if (data?.payload) {
                        onDataPointClick(data.payload);
                      }
                    },
                    style: { cursor: 'pointer' },
                  }
                : { fill: color, strokeWidth: 2, r: 4 }
            }
            activeDot={{
              r: 6,
              stroke: color,
              strokeWidth: 2,
              onClick: onDataPointClick
                ? (data) => {
                    if (data?.payload) {
                      onDataPointClick(data.payload);
                    }
                  }
                : undefined,
            }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
});
