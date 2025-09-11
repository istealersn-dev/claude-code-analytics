import { memo, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface ComparisonData {
  label: string;
  data: Array<{ date: string; value: number; count?: number }>;
  color: string;
  type: 'line' | 'bar';
}

interface ChartComparisonProps {
  datasets: ComparisonData[];
  height?: number;
  title?: string;
  showLegend?: boolean;
  syncDomains?: boolean;
}

type ComparisonView = 'overlay' | 'side-by-side' | 'stacked';

export const ChartComparison = memo(function ChartComparison({
  datasets,
  height = 400,
  title = 'Chart Comparison',
  showLegend = true,
  syncDomains = true,
}: ChartComparisonProps) {
  const [view, setView] = useState<ComparisonView>('overlay');
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(
    new Set(datasets.map(d => d.label))
  );

  // Filter datasets based on selection
  const activeDatasets = useMemo(() => 
    datasets.filter(d => selectedMetrics.has(d.label)),
    [datasets, selectedMetrics]
  );

  // Merge data for overlay view
  const mergedData = useMemo(() => {
    if (activeDatasets.length === 0) return [];

    const dateMap = new Map<string, any>();
    
    activeDatasets.forEach(dataset => {
      dataset.data.forEach(item => {
        if (!dateMap.has(item.date)) {
          dateMap.set(item.date, { date: item.date });
        }
        dateMap.get(item.date)![dataset.label] = item.value;
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [activeDatasets]);

  // Calculate domain for synchronized scaling
  const yDomain = useMemo(() => {
    if (!syncDomains) return undefined;
    
    const allValues = activeDatasets.flatMap(d => d.data.map(item => item.value));
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;
    
    return [Math.max(0, min - padding), max + padding];
  }, [activeDatasets, syncDomains]);

  const toggleMetric = (label: string) => {
    setSelectedMetrics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const renderOverlayChart = () => (
    <ResponsiveContainer width="100%" height={height - 60}>
      <LineChart data={mergedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          stroke="#9CA3AF"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={yDomain}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
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
        />
        {activeDatasets.map(dataset => (
          <Line
            key={dataset.label}
            type="monotone"
            dataKey={dataset.label}
            stroke={dataset.color}
            strokeWidth={2}
            dot={{ fill: dataset.color, strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: dataset.color, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  const renderSideBySideCharts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {activeDatasets.map(dataset => (
        <div key={dataset.label} className="border border-gray-600 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2 text-gray-300">{dataset.label}</h4>
          <ResponsiveContainer width="100%" height={(height - 120) / 2}>
            {dataset.type === 'line' ? (
              <LineChart data={dataset.data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={yDomain}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={dataset.color}
                  strokeWidth={2}
                  dot={{ fill: dataset.color, r: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={dataset.data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={yDomain}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill={dataset.color} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );

  const renderStackedChart = () => (
    <ResponsiveContainer width="100%" height={height - 60}>
      <BarChart data={mergedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          stroke="#9CA3AF"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#F9FAFB' }}
        />
        {activeDatasets.map(dataset => (
          <Bar
            key={dataset.label}
            dataKey={dataset.label}
            stackId="a"
            fill={dataset.color}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  if (datasets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No datasets available for comparison
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        
        {/* View Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setView('overlay')}
              className={`px-3 py-1 text-xs rounded ${
                view === 'overlay' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Overlay
            </button>
            <button
              onClick={() => setView('side-by-side')}
              className={`px-3 py-1 text-xs rounded ${
                view === 'side-by-side' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setView('stacked')}
              className={`px-3 py-1 text-xs rounded ${
                view === 'stacked' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Stacked
            </button>
          </div>
        </div>
      </div>

      {/* Legend / Metric Selection */}
      {showLegend && (
        <div className="flex flex-wrap gap-2 mb-4">
          {datasets.map(dataset => (
            <button
              key={dataset.label}
              onClick={() => toggleMetric(dataset.label)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all ${
                selectedMetrics.has(dataset.label)
                  ? 'bg-gray-700 border-2 border-gray-500'
                  : 'bg-gray-800 border-2 border-gray-600 opacity-50'
              }`}
            >
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: dataset.color }}
              />
              <span className="text-gray-300">{dataset.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chart Content */}
      <div className="relative">
        {activeDatasets.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Select at least one metric to compare
          </div>
        ) : (
          <>
            {view === 'overlay' && renderOverlayChart()}
            {view === 'side-by-side' && renderSideBySideCharts()}
            {view === 'stacked' && renderStackedChart()}
          </>
        )}
      </div>

      {/* Chart Info */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{activeDatasets.length} metric(s) selected</span>
          <span>
            {syncDomains ? 'Synchronized scale' : 'Individual scales'}
          </span>
        </div>
      </div>
    </div>
  );
});