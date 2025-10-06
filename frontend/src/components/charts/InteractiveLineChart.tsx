import { MessageSquare, RotateCcw } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartMouseEvent {
  activeLabel?: string;
  activePayload?: Array<{ payload: { date: string; value: number } }>;
}

interface ChartAnnotation {
  id: string;
  date: string;
  value: number;
  text: string;
  color: string;
}

export interface InteractiveLineChartProps {
  data: Array<{ date: string; value: number; count?: number }>;
  height?: number;
  color?: string;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number) => [string, string];
  showGrid?: boolean;
  onDataPointClick?: (data: { date: string; value: number; count?: number }) => void;
  annotations?: ChartAnnotation[];
  onAnnotationAdd?: (annotation: Omit<ChartAnnotation, 'id'>) => void;
  enableZoom?: boolean;
  enableAnnotations?: boolean;
}

export const InteractiveLineChart = memo(function InteractiveLineChart({
  data,
  height = 300,
  color = '#FF6B35',
  formatValue = (value) => value.toString(),
  formatTooltip = (value) => [formatValue?.(value) || value.toString(), 'Value'],
  showGrid = true,
  onDataPointClick,
  annotations = [],
  onAnnotationAdd,
  enableZoom = true,
  enableAnnotations = true,
}: InteractiveLineChartProps) {
  const [zoomState, setZoomState] = useState<{
    left?: string;
    right?: string;
    refAreaLeft?: string;
    refAreaRight?: string;
    isZooming?: boolean;
  }>({});

  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [annotationPoint, setAnnotationPoint] = useState<{ date: string; value: number } | null>(
    null,
  );
  const [annotationText, setAnnotationText] = useState('');

  const chartRef = useRef<SVGSVGElement>(null);

  // Filter data based on zoom state
  const displayData = useMemo(() => {
    if (!zoomState.left || !zoomState.right) return data;

    const startDate = new Date(zoomState.left);
    const endDate = new Date(zoomState.right);

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, zoomState.left, zoomState.right]);

  const chartMargin = useMemo(() => ({ top: 20, right: 30, left: 20, bottom: 20 }), []);

  const handleMouseDown = useCallback(
    (e: ChartMouseEvent | null) => {
      if (!enableZoom || !e || !e.activeLabel) return;
      setZoomState((prev) => ({ ...prev, refAreaLeft: e.activeLabel, isZooming: true }));
    },
    [enableZoom],
  );

  const handleMouseMove = useCallback(
    (e: ChartMouseEvent | null) => {
      if (!enableZoom || !zoomState.isZooming || !e || !e.activeLabel) return;
      setZoomState((prev) => ({ ...prev, refAreaRight: e.activeLabel }));
    },
    [enableZoom, zoomState.isZooming],
  );

  const handleMouseUp = useCallback(() => {
    if (!enableZoom || !zoomState.refAreaLeft || !zoomState.refAreaRight) {
      setZoomState((prev) => ({
        ...prev,
        isZooming: false,
        refAreaLeft: undefined,
        refAreaRight: undefined,
      }));
      return;
    }

    let left = zoomState.refAreaLeft;
    let right = zoomState.refAreaRight;

    // Ensure left is before right
    if (new Date(left) > new Date(right)) {
      [left, right] = [right, left];
    }

    setZoomState({
      left,
      right,
      isZooming: false,
      refAreaLeft: undefined,
      refAreaRight: undefined,
    });
  }, [enableZoom, zoomState.refAreaLeft, zoomState.refAreaRight]);

  const handleZoomOut = useCallback(() => {
    setZoomState({});
  }, []);

  const handleChartDoubleClick = useCallback(
    (e: ChartMouseEvent | null) => {
      if (!enableAnnotations || !onAnnotationAdd || !e?.activePayload?.[0]?.payload) return;

      const payload = e.activePayload[0].payload;
      setAnnotationPoint({ date: payload.date, value: payload.value });
      setShowAnnotationDialog(true);
    },
    [enableAnnotations, onAnnotationAdd],
  );

  const handleAddAnnotation = useCallback(() => {
    if (!annotationPoint || !annotationText.trim() || !onAnnotationAdd) return;

    onAnnotationAdd({
      date: annotationPoint.date,
      value: annotationPoint.value,
      text: annotationText.trim(),
      color: '#FF6B35',
    });

    setShowAnnotationDialog(false);
    setAnnotationText('');
    setAnnotationPoint(null);
  }, [annotationPoint, annotationText, onAnnotationAdd]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <div style={{ height, position: 'relative' }}>
      {/* Chart Controls */}
      <div className="absolute top-2 right-2 z-20 flex gap-2">
        {enableZoom && (
          <>
            <button type="button"
              onClick={handleZoomOut}
              disabled={!zoomState.left && !zoomState.right}
              className="p-1.5 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reset Zoom"
            >
              <RotateCcw size={14} />
            </button>
            <div className="p-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300">
              {zoomState.left ? 'Zoomed' : 'Drag to zoom'}
            </div>
          </>
        )}
        {enableAnnotations && (
          <div className="p-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 flex items-center gap-1">
            <MessageSquare size={12} />
            Double-click to annotate
          </div>
        )}
      </div>

      {/* Annotation Dialog */}
      {showAnnotationDialog && (
        <div className="absolute inset-0 z-30 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-3">Add Annotation</h3>
            <p className="text-sm text-gray-300 mb-3">
              {annotationPoint && `Date: ${new Date(annotationPoint.date).toLocaleDateString()}`}
            </p>
            <textarea
              value={annotationText}
              onChange={(e) => setAnnotationText(e.target.value)}
              placeholder="Enter annotation text..."
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <button type="button"
                onClick={handleAddAnnotation}
                disabled={!annotationText.trim()}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
              >
                Add
              </button>
              <button type="button"
                onClick={() => {
                  setShowAnnotationDialog(false);
                  setAnnotationText('');
                  setAnnotationPoint(null);
                }}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          ref={chartRef}
          data={displayData}
          margin={chartMargin}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleChartDoubleClick}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />}

          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={['dataMin', 'dataMax']}
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
            domain={['dataMin - 5%', 'dataMax + 5%']}
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

          {/* Zoom selection area */}
          {zoomState.refAreaLeft && zoomState.refAreaRight && (
            <ReferenceArea
              x1={zoomState.refAreaLeft}
              x2={zoomState.refAreaRight}
              strokeOpacity={0.3}
              fill="rgba(255, 107, 53, 0.2)"
            />
          )}

          {/* Annotations */}
          {annotations.map((annotation) => (
            <ReferenceLine
              key={annotation.id}
              x={annotation.date}
              stroke={annotation.color}
              strokeDasharray="2 2"
              label={{
                value: annotation.text,
                position: 'topLeft',
                offset: 10,
                style: {
                  fontSize: '11px',
                  fill: annotation.color,
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  padding: '2px 4px',
                  borderRadius: '2px',
                },
              }}
            />
          ))}

          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 3 }}
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
