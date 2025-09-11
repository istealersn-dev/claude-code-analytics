import { memo, useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Save, Download, Settings, Palette, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface ChartConfig {
  id: string;
  name: string;
  type: 'line' | 'bar' | 'area' | 'pie';
  dataSource: string;
  xAxis: string;
  yAxis: string;
  groupBy?: string;
  aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min';
  color: string;
  showGrid: boolean;
  showLegend: boolean;
  height: number;
  filters: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less';
    value: string;
  }>;
}

interface ChartBuilderProps {
  availableFields: Array<{
    name: string;
    type: 'string' | 'number' | 'date';
    values?: string[];
  }>;
  data: Array<Record<string, any>>;
  onSaveChart?: (config: ChartConfig) => void;
  onExportChart?: (config: ChartConfig, data: any[]) => void;
  initialConfig?: Partial<ChartConfig>;
}

const CHART_TYPES = [
  { id: 'line', name: 'Line Chart', icon: LineChartIcon },
  { id: 'bar', name: 'Bar Chart', icon: BarChart3 },
  { id: 'area', name: 'Area Chart', icon: TrendingUp },
  { id: 'pie', name: 'Pie Chart', icon: PieChartIcon },
] as const;

const COLORS = [
  '#FF6B35', '#4F46E5', '#059669', '#DC2626', '#7C3AED',
  '#EA580C', '#0891B2', '#BE123C', '#0F766E', '#7C2D12'
];

const AGGREGATIONS = [
  { id: 'sum', name: 'Sum' },
  { id: 'avg', name: 'Average' },
  { id: 'count', name: 'Count' },
  { id: 'max', name: 'Maximum' },
  { id: 'min', name: 'Minimum' },
] as const;

export const ChartBuilder = memo(function ChartBuilder({
  availableFields,
  data,
  onSaveChart,
  onExportChart,
  initialConfig,
}: ChartBuilderProps) {
  const [config, setConfig] = useState<ChartConfig>({
    id: Date.now().toString(),
    name: 'Custom Chart',
    type: 'line',
    dataSource: 'sessions',
    xAxis: '',
    yAxis: '',
    aggregation: 'sum',
    color: COLORS[0],
    showGrid: true,
    showLegend: true,
    height: 300,
    filters: [],
    ...initialConfig,
  });

  const [showSettings, setShowSettings] = useState(false);

  // Process data based on configuration
  const processedData = useMemo(() => {
    if (!config.xAxis || !config.yAxis || !data.length) return [];

    let filtered = data;

    // Apply filters
    config.filters.forEach(filter => {
      filtered = filtered.filter(item => {
        const value = item[filter.field];
        const filterValue = filter.value;

        switch (filter.operator) {
          case 'equals':
            return value === filterValue;
          case 'contains':
            return String(value).toLowerCase().includes(filterValue.toLowerCase());
          case 'greater':
            return Number(value) > Number(filterValue);
          case 'less':
            return Number(value) < Number(filterValue);
          default:
            return true;
        }
      });
    });

    // Group and aggregate data
    if (config.groupBy) {
      const grouped = filtered.reduce((acc, item) => {
        const groupKey = item[config.groupBy!];
        const xValue = item[config.xAxis];
        const yValue = Number(item[config.yAxis]) || 0;

        const key = `${groupKey}-${xValue}`;
        if (!acc[key]) {
          acc[key] = {
            [config.xAxis]: xValue,
            group: groupKey,
            values: [],
          };
        }
        acc[key].values.push(yValue);
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped).map((item: any) => {
        let aggregatedValue = 0;
        switch (config.aggregation) {
          case 'sum':
            aggregatedValue = item.values.reduce((sum: number, val: number) => sum + val, 0);
            break;
          case 'avg':
            aggregatedValue = item.values.reduce((sum: number, val: number) => sum + val, 0) / item.values.length;
            break;
          case 'count':
            aggregatedValue = item.values.length;
            break;
          case 'max':
            aggregatedValue = Math.max(...item.values);
            break;
          case 'min':
            aggregatedValue = Math.min(...item.values);
            break;
        }

        return {
          [config.xAxis]: item[config.xAxis],
          [config.yAxis]: aggregatedValue,
          group: item.group,
        };
      });
    }

    // Simple aggregation by x-axis
    const grouped = filtered.reduce((acc, item) => {
      const xValue = item[config.xAxis];
      const yValue = Number(item[config.yAxis]) || 0;

      if (!acc[xValue]) {
        acc[xValue] = {
          [config.xAxis]: xValue,
          values: [],
        };
      }
      acc[xValue].values.push(yValue);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((item: any) => {
      let aggregatedValue = 0;
      switch (config.aggregation) {
        case 'sum':
          aggregatedValue = item.values.reduce((sum: number, val: number) => sum + val, 0);
          break;
        case 'avg':
          aggregatedValue = item.values.reduce((sum: number, val: number) => sum + val, 0) / item.values.length;
          break;
        case 'count':
          aggregatedValue = item.values.length;
          break;
        case 'max':
          aggregatedValue = Math.max(...item.values);
          break;
        case 'min':
          aggregatedValue = Math.min(...item.values);
          break;
      }

      return {
        [config.xAxis]: item[config.xAxis],
        [config.yAxis]: aggregatedValue,
      };
    }).sort((a, b) => {
      const aValue = a[config.xAxis];
      const bValue = b[config.xAxis];
      
      // Try to sort as dates first, then numbers, then strings
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        return aDate.getTime() - bDate.getTime();
      }
      
      if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
        return Number(aValue) - Number(bValue);
      }
      
      return String(aValue).localeCompare(String(bValue));
    });
  }, [config, data]);

  const updateConfig = (updates: Partial<ChartConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const addFilter = () => {
    setConfig(prev => ({
      ...prev,
      filters: [...prev.filters, { field: '', operator: 'equals', value: '' }]
    }));
  };

  const updateFilter = (index: number, updates: Partial<typeof config.filters[0]>) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, ...updates } : filter
      )
    }));
  };

  const removeFilter = (index: number) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const renderChart = () => {
    if (!processedData.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          Configure chart settings to see preview
        </div>
      );
    }

    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (config.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />}
            <XAxis dataKey={config.xAxis} stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
            <Line 
              type="monotone" 
              dataKey={config.yAxis} 
              stroke={config.color} 
              strokeWidth={2}
              dot={{ fill: config.color, r: 3 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />}
            <XAxis dataKey={config.xAxis} stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
            <Bar dataKey={config.yAxis} fill={config.color} />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />}
            <XAxis dataKey={config.xAxis} stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
            <Area 
              type="monotone" 
              dataKey={config.yAxis} 
              stroke={config.color} 
              fill={config.color}
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={processedData.slice(0, 10)} // Limit to top 10 for pie chart
              dataKey={config.yAxis}
              nameKey={config.xAxis}
              cx="50%"
              cy="50%"
              outerRadius={80}
            >
              {processedData.slice(0, 10).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
            {config.showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <input
            type="text"
            value={config.name}
            onChange={(e) => updateConfig({ name: e.target.value })}
            className="text-xl font-semibold bg-transparent border-none text-white focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-2 py-1"
          />
          <p className="text-sm text-gray-400 mt-1">Custom chart configuration</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded"
            title="Settings"
          >
            <Settings size={16} />
          </button>
          {onSaveChart && (
            <button
              onClick={() => onSaveChart(config)}
              className="p-2 bg-orange-600 hover:bg-orange-700 rounded"
              title="Save Chart"
            >
              <Save size={16} />
            </button>
          )}
          {onExportChart && (
            <button
              onClick={() => onExportChart(config, processedData)}
              className="p-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded"
              title="Export Chart"
            >
              <Download size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Chart Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Chart Type</label>
            <div className="grid grid-cols-2 gap-2">
              {CHART_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => updateConfig({ type: type.id as any })}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                      config.type === type.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Axis Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">X-Axis</label>
            <select
              value={config.xAxis}
              onChange={(e) => updateConfig({ xAxis: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
            >
              <option value="">Select field...</option>
              {availableFields.map(field => (
                <option key={field.name} value={field.name}>
                  {field.name} ({field.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Y-Axis</label>
            <select
              value={config.yAxis}
              onChange={(e) => updateConfig({ yAxis: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
            >
              <option value="">Select field...</option>
              {availableFields.filter(f => f.type === 'number').map(field => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Aggregation</label>
            <select
              value={config.aggregation}
              onChange={(e) => updateConfig({ aggregation: e.target.value as any })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
            >
              {AGGREGATIONS.map(agg => (
                <option key={agg.id} value={agg.id}>{agg.name}</option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => updateConfig({ color })}
                  className={`w-8 h-8 rounded border-2 ${
                    config.color === color ? 'border-white' : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="space-y-4 pt-4 border-t border-gray-600">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showGrid"
                  checked={config.showGrid}
                  onChange={(e) => updateConfig({ showGrid: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="showGrid" className="text-sm text-gray-300">Show Grid</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showLegend"
                  checked={config.showLegend}
                  onChange={(e) => updateConfig({ showLegend: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="showLegend" className="text-sm text-gray-300">Show Legend</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Height (px)</label>
                <input
                  type="number"
                  value={config.height}
                  onChange={(e) => updateConfig({ height: Number(e.target.value) })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                  min="200"
                  max="800"
                  step="50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Chart Preview */}
        <div className="lg:col-span-2">
          <div className="border border-gray-600 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-4">Preview</h4>
            <ResponsiveContainer width="100%" height={config.height}>
              {renderChart()}
            </ResponsiveContainer>
          </div>
          
          {/* Data Summary */}
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Data Points: {processedData.length}</span>
              <span>Chart Type: {CHART_TYPES.find(t => t.id === config.type)?.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});