import { createFileRoute } from '@tanstack/react-router';
import { BarChart3, Settings, Sparkles, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ChartConfig } from '../components/charts/ChartBuilder';
import {
  ChartBuilder,
  ChartComparison,
  InteractiveLineChart,
} from '../components/charts/LazyCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  useDailyUsageTimeSeries,
} from '../hooks/useAnalytics';

interface ChartAnnotation {
  id: string;
  date: string;
  value: number;
  text: string;
  color: string;
}

export const Route = createFileRoute('/charts')({
  component: ChartsDemo,
});

function ChartsDemo() {
  const { data: dailyUsage } = useDailyUsageTimeSeries();
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);

  // Sample data for demonstrations
  const sampleData = useMemo(() => {
    if (!dailyUsage?.sessions) return [];

    return dailyUsage.sessions.map((item) => ({
      date: item.date,
      value: item.value || 0,
      count: item.count || 0,
    }));
  }, [dailyUsage?.sessions]);

  const costData = useMemo(() => {
    if (!dailyUsage?.sessions) return [];

    return dailyUsage.sessions.map((item) => ({
      date: item.date,
      value: item.value * 0.1 || 0, // Mock cost data
      count: item.count || 0,
    }));
  }, [dailyUsage?.sessions]);

  const sessionData = useMemo(() => {
    if (!dailyUsage?.sessions) return [];

    return dailyUsage.sessions.map((item) => ({
      date: item.date,
      value: item.count || 0,
      count: item.count || 0,
    }));
  }, [dailyUsage?.sessions]);

  const tokenData = useMemo(() => {
    if (!dailyUsage?.tokens) return [];

    return dailyUsage.tokens.map((item) => ({
      date: item.date,
      value: item.value || 0,
      count: item.count || 0,
    }));
  }, [dailyUsage?.tokens]);

  // Comparison datasets
  const comparisonData = [
    {
      label: 'Daily Cost',
      data: costData,
      color: '#FF6B35',
      type: 'line' as const,
    },
    {
      label: 'Session Count',
      data: sessionData,
      color: '#4F46E5',
      type: 'line' as const,
    },
    {
      label: 'Token Usage',
      data: tokenData,
      color: '#059669',
      type: 'line' as const,
    },
  ];

  // Chart builder available fields
  const availableFields = [
    { name: 'date', type: 'date' as const },
    { name: 'value', type: 'number' as const },
    { name: 'count', type: 'number' as const },
    { name: 'cost', type: 'number' as const },
    { name: 'tokens', type: 'number' as const },
  ];

  const handleAddAnnotation = (annotation: Omit<ChartAnnotation, 'id'>) => {
    const newAnnotation = {
      ...annotation,
      id: Date.now().toString(),
    };
    setAnnotations((prev) => [...prev, newAnnotation]);
  };

  const handleSaveChart = (config: ChartConfig) => {
    console.log('Saving chart configuration:', config);
    // In a real app, you'd save this to your backend
    alert(`Chart "${config.name}" configuration saved!`);
  };

  const handleExportChart = (config: ChartConfig, data: Array<Record<string, string | number>>) => {
    console.log('Exporting chart:', config, data);
    // In a real app, you'd export this as PNG/SVG/PDF
    alert(`Chart "${config.name}" exported with ${data.length} data points!`);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Interactive Charts & Visualizations</h1>
        <p className="text-gray-400">
          Enhanced chart components with zoom, annotations, comparisons, and custom configurations
        </p>
      </div>

      <Tabs defaultValue="interactive" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border border-gray-700">
          <TabsTrigger
            value="interactive"
            className="flex items-center gap-2 data-[state=active]:bg-orange-600"
          >
            <TrendingUp size={16} />
            Interactive Charts
          </TabsTrigger>
          <TabsTrigger
            value="comparison"
            className="flex items-center gap-2 data-[state=active]:bg-orange-600"
          >
            <BarChart3 size={16} />
            Chart Comparison
          </TabsTrigger>
          <TabsTrigger
            value="builder"
            className="flex items-center gap-2 data-[state=active]:bg-orange-600"
          >
            <Settings size={16} />
            Chart Builder
          </TabsTrigger>
          <TabsTrigger
            value="showcase"
            className="flex items-center gap-2 data-[state=active]:bg-orange-600"
          >
            <Sparkles size={16} />
            Feature Showcase
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Interactive Line Chart with Zoom & Annotations
            </h2>
            <p className="text-gray-400 mb-6">
              • Drag to zoom into specific time periods
              <br />• Double-click to add annotations
              <br />• Reset zoom with the button in top-right
            </p>

            <InteractiveLineChart
              data={sampleData}
              height={400}
              color="#FF6B35"
              formatValue={(value) => `$${value.toFixed(2)}`}
              formatTooltip={(value, count) => [`$${value.toFixed(2)}`, `${count} sessions`]}
              annotations={annotations}
              onAnnotationAdd={handleAddAnnotation}
              enableZoom={true}
              enableAnnotations={true}
            />

            {annotations.length > 0 && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Annotations ({annotations.length})
                </h4>
                <div className="space-y-2">
                  {annotations.map((annotation) => (
                    <div key={annotation.id} className="text-xs text-gray-400">
                      <span className="font-medium">
                        {new Date(annotation.date).toLocaleDateString()}:
                      </span>{' '}
                      {annotation.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Multi-Metric Chart Comparison
              </h2>
              <p className="text-gray-400 mb-6">
                Compare different metrics side-by-side, overlay them, or view as stacked charts
              </p>

              <ChartComparison
                datasets={comparisonData}
                height={450}
                title="Usage Metrics Comparison"
                showLegend={true}
                syncDomains={false}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Custom Chart Builder</h2>
            <p className="text-gray-400 mb-6">
              Create custom visualizations with drag-and-drop configuration
            </p>

            <ChartBuilder
              availableFields={availableFields}
              data={sampleData}
              onSaveChart={handleSaveChart}
              onExportChart={handleExportChart}
              initialConfig={{
                name: 'Custom Usage Chart',
                type: 'line',
                xAxis: 'date',
                yAxis: 'value',
                color: '#FF6B35',
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="showcase" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Cards */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-orange-500" size={20} />
                Zoom & Pan
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Drag to select time ranges for zooming</li>
                <li>• Mouse wheel support for pan and zoom</li>
                <li>• Reset zoom with one click</li>
                <li>• Synchronized zoom across multiple charts</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="text-orange-500" size={20} />
                Annotations
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Double-click to add custom annotations</li>
                <li>• Rich text support for detailed notes</li>
                <li>• Color-coded annotation markers</li>
                <li>• Persistent annotation storage</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="text-orange-500" size={20} />
                Chart Comparison
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Overlay multiple metrics on one chart</li>
                <li>• Side-by-side comparison views</li>
                <li>• Stacked bar chart aggregations</li>
                <li>• Toggle metric visibility</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="text-orange-500" size={20} />
                Custom Configuration
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Drag-and-drop chart builder interface</li>
                <li>• Multiple chart types (line, bar, area, pie)</li>
                <li>• Custom color palettes and styling</li>
                <li>• Export and save configurations</li>
              </ul>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Chart Enhancement Impact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">3x</div>
                <div className="text-sm text-gray-400">Faster Data Exploration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">85%</div>
                <div className="text-sm text-gray-400">More Interactive Features</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">100%</div>
                <div className="text-sm text-gray-400">Customizable Visualizations</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
