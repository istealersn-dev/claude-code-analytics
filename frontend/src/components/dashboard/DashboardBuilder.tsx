import { memo, useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout as GridLayout } from 'react-grid-layout';
import { 
  Plus, Save, Download, RotateCcw, Settings, 
  BarChart3, PieChart, TrendingUp, Activity,
  Grid, Eye, Edit3, Trash2, Copy
} from 'lucide-react';
import { LineChart, PieChart as PieChartComponent, BarChart } from '../charts/LazyCharts';
import { useOverviewMetrics, useDailyUsageTimeSeries, useDistributionData } from '../../hooks/useAnalytics';
import { DashboardWidget, DashboardTemplate } from './DashboardTemplates';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardBuilderProps {
  initialTemplate?: DashboardTemplate;
  onSave?: (template: DashboardTemplate) => void;
  onExport?: (template: DashboardTemplate) => void;
  availableTemplates?: DashboardTemplate[];
}

const WIDGET_TYPES = [
  { 
    id: 'line-chart', 
    name: 'Line Chart', 
    icon: TrendingUp, 
    defaultSize: { w: 6, h: 4 },
    description: 'Time series data visualization'
  },
  { 
    id: 'pie-chart', 
    name: 'Pie Chart', 
    icon: PieChart, 
    defaultSize: { w: 4, h: 4 },
    description: 'Categorical data distribution'
  },
  { 
    id: 'bar-chart', 
    name: 'Bar Chart', 
    icon: BarChart3, 
    defaultSize: { w: 6, h: 4 },
    description: 'Comparative data visualization'
  },
  { 
    id: 'metric-card', 
    name: 'Metric Card', 
    icon: Activity, 
    defaultSize: { w: 3, h: 2 },
    description: 'Single value display'
  },
] as const;

const DEFAULT_TEMPLATE: DashboardTemplate = {
  id: 'new-dashboard',
  name: 'New Dashboard',
  description: 'Custom dashboard template',
  widgets: [],
  layout: [],
  created: new Date(),
  updated: new Date(),
};

export const DashboardBuilder = memo(function DashboardBuilder({
  initialTemplate = DEFAULT_TEMPLATE,
  onSave,
  onExport,
  availableTemplates = [],
}: DashboardBuilderProps) {
  const [template, setTemplate] = useState<DashboardTemplate>(initialTemplate);
  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showWidgetPanel, setShowWidgetPanel] = useState(true);
  
  const { data: overviewMetrics } = useOverviewMetrics();
  const { data: dailyUsage } = useDailyUsageTimeSeries();
  const { data: distributions } = useDistributionData();

  // Convert widgets to grid layout format
  const layoutItems = useMemo(() => 
    template.widgets.map(widget => ({
      i: widget.id,
      x: widget.layout.x,
      y: widget.layout.y,
      w: widget.layout.w,
      h: widget.layout.h,
      minW: 2,
      minH: 2,
    })),
    [template.widgets]
  );

  const updateTemplate = useCallback((updates: Partial<DashboardTemplate>) => {
    setTemplate(prev => ({
      ...prev,
      ...updates,
      updated: new Date(),
    }));
  }, []);

  const addWidget = useCallback((type: string) => {
    const widgetType = WIDGET_TYPES.find(w => w.id === type);
    if (!widgetType) return;

    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: type as any,
      title: `New ${widgetType.name}`,
      config: {
        dataSource: 'sessions',
        metric: 'total_cost',
        aggregation: 'sum',
        color: '#FF6B35',
        showLegend: true,
        height: 300,
        filters: [],
      },
      layout: {
        x: 0,
        y: 0,
        w: widgetType.defaultSize.w,
        h: widgetType.defaultSize.h,
      },
    };

    setTemplate(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      updated: new Date(),
    }));
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setTemplate(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId),
      updated: new Date(),
    }));
    setSelectedWidget(null);
  }, []);

  const duplicateWidget = useCallback((widgetId: string) => {
    const widget = template.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}`,
      title: `${widget.title} (Copy)`,
      layout: {
        ...widget.layout,
        x: widget.layout.x + 1,
        y: widget.layout.y + 1,
      },
    };

    setTemplate(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      updated: new Date(),
    }));
  }, [template.widgets]);

  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    setTemplate(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      ),
      updated: new Date(),
    }));
  }, []);

  const handleLayoutChange = useCallback((layout: GridLayout[]) => {
    if (!isEditMode) return;

    setTemplate(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget => {
        const layoutItem = layout.find(l => l.i === widget.id);
        if (!layoutItem) return widget;

        return {
          ...widget,
          layout: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        };
      }),
      updated: new Date(),
    }));
  }, [isEditMode]);

  const renderWidget = useCallback((widget: DashboardWidget) => {
    const isSelected = selectedWidget === widget.id;
    
    // Sample data for demonstration
    const sampleData = (dailyUsage?.sessions ?? []).slice(0, 30).map(item => ({
      date: item.date,
      value: item.value * 0.1 || 0, // Mock cost data
      count: item.count || 0,
    })) || [];

    const renderWidgetContent = () => {
      switch (widget.type) {
        case 'line-chart':
          return (
            <LineChart
              data={sampleData}
              height={widget.config.height || 200}
              color={widget.config.color || '#FF6B35'}
              formatValue={(value) => `$${value.toFixed(2)}`}
            />
          );
        
        case 'pie-chart':
          const pieData = (distributions?.modelUsage ?? []).slice(0, 5).map(item => ({
            name: item.name,
            value: item.value,
          })) || [];
          
          return (
            <PieChartComponent
              data={pieData}
              height={widget.config.height || 200}
              showLegend={widget.config.showLegend}
            />
          );
          
        case 'bar-chart':
          return (
            <BarChart
              data={sampleData.slice(0, 10)}
              height={widget.config.height || 200}
              color={widget.config.color || '#FF6B35'}
            />
          );
          
        case 'metric-card':
          const totalCost = overviewMetrics?.totalCost || 0;
          return (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-3xl font-bold text-white">
                ${totalCost.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Total Cost
              </div>
            </div>
          );
          
        default:
          return (
            <div className="flex items-center justify-center h-full text-gray-400">
              Widget type not implemented
            </div>
          );
      }
    };

    return (
      <div
        key={widget.id}
        className={`relative bg-gray-800 border rounded-lg overflow-hidden transition-all ${
          isSelected ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-600'
        } ${isEditMode ? 'cursor-move' : ''}`}
        onClick={() => isEditMode && setSelectedWidget(widget.id)}
      >
        {/* Widget Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-600">
          <h3 className="text-sm font-medium text-white truncate">
            {widget.title}
          </h3>
          
          {isEditMode && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateWidget(widget.id);
                }}
                className="p-1 hover:bg-gray-700 rounded"
                title="Duplicate"
              >
                <Copy size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeWidget(widget.id);
                }}
                className="p-1 hover:bg-gray-700 rounded text-red-400"
                title="Remove"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Widget Content */}
        <div className="p-2">
          {renderWidgetContent()}
        </div>
      </div>
    );
  }, [selectedWidget, isEditMode, overviewMetrics, dailyUsage, distributions, duplicateWidget, removeWidget]);

  const renderWidgetPanel = () => (
    <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-4">Add Widgets</h3>
      
      <div className="space-y-2">
        {WIDGET_TYPES.map(type => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => addWidget(type.id)}
              className="w-full p-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className="text-orange-500" />
                <div>
                  <div className="text-sm font-medium text-white">
                    {type.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {type.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Widget Properties */}
      {selectedWidget && (
        <div className="mt-6 pt-6 border-t border-gray-600">
          <h4 className="text-md font-medium text-white mb-3">Properties</h4>
          
          {(() => {
            const widget = template.widgets.find(w => w.id === selectedWidget);
            if (!widget) return null;

            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={widget.title}
                    onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={widget.config.color || '#FF6B35'}
                    onChange={(e) => updateWidget(widget.id, {
                      config: { ...widget.config, color: e.target.value }
                    })}
                    className="w-full h-8 bg-gray-700 border border-gray-600 rounded"
                  />
                </div>

                {widget.type !== 'metric-card' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={widget.config.height || 300}
                      onChange={(e) => updateWidget(widget.id, {
                        config: { ...widget.config, height: Number(e.target.value) }
                      })}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                      min="150"
                      max="600"
                    />
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Widget Panel */}
      {showWidgetPanel && isEditMode && renderWidgetPanel()}

      {/* Main Dashboard Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={template.name}
                onChange={(e) => updateTemplate({ name: e.target.value })}
                className="text-xl font-semibold bg-transparent border-none text-white focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-2 py-1"
                disabled={!isEditMode}
              />
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`p-2 rounded border transition-colors ${
                    isEditMode 
                      ? 'bg-orange-600 border-orange-500 text-white' 
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  title={isEditMode ? 'Preview Mode' : 'Edit Mode'}
                >
                  {isEditMode ? <Eye size={16} /> : <Edit3 size={16} />}
                </button>
                
                {isEditMode && (
                  <button
                    onClick={() => setShowWidgetPanel(!showWidgetPanel)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded"
                    title="Toggle Widget Panel"
                  >
                    <Grid size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTemplate(DEFAULT_TEMPLATE)}
                className="p-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded"
                title="Reset Dashboard"
              >
                <RotateCcw size={16} />
              </button>
              
              {onSave && (
                <button
                  onClick={() => onSave(template)}
                  className="p-2 bg-orange-600 hover:bg-orange-700 rounded"
                  title="Save Dashboard"
                >
                  <Save size={16} />
                </button>
              )}
              
              {onExport && (
                <button
                  onClick={() => onExport(template)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded"
                  title="Export Dashboard"
                >
                  <Download size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 p-4 overflow-auto">
          {template.widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Grid size={48} className="mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Start Building Your Dashboard</h3>
              <p className="text-center mb-6 max-w-md">
                Add widgets from the side panel to create your custom analytics dashboard.
                Drag and resize widgets to arrange them as needed.
              </p>
              {isEditMode && (
                <button
                  onClick={() => setShowWidgetPanel(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Your First Widget
                </button>
              )}
            </div>
          ) : (
            <ResponsiveGridLayout
              className="layout"
              layouts={{ lg: layoutItems }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={60}
              onLayoutChange={handleLayoutChange}
              isDraggable={isEditMode}
              isResizable={isEditMode}
              margin={[16, 16]}
              containerPadding={[0, 0]}
            >
              {template.widgets.map(renderWidget)}
            </ResponsiveGridLayout>
          )}
        </div>
      </div>
    </div>
  );
});
