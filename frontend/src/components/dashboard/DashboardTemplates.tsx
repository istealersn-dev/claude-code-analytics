import { memo, useState, useCallback } from 'react';
import { 
  Plus, Search, Calendar, Eye, Edit3, Trash2, 
  Copy, Download, Upload, Star, Grid, Layout
} from 'lucide-react';
import { DashboardTemplate } from './DashboardBuilder';

interface DashboardTemplatesProps {
  templates: DashboardTemplate[];
  onSelectTemplate: (template: DashboardTemplate) => void;
  onCreateNew: () => void;
  onDuplicateTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onExportTemplate: (templateId: string) => void;
  onImportTemplate: (template: DashboardTemplate) => void;
}

const PRESET_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level metrics and KPIs for leadership review',
    widgets: [
      {
        id: 'total-cost-card',
        type: 'metric-card',
        title: 'Total Cost',
        config: { color: '#FF6B35', height: 120 },
        layout: { x: 0, y: 0, w: 3, h: 2 }
      },
      {
        id: 'session-count-card',
        type: 'metric-card',
        title: 'Total Sessions',
        config: { color: '#4F46E5', height: 120 },
        layout: { x: 3, y: 0, w: 3, h: 2 }
      },
      {
        id: 'monthly-trend',
        type: 'line-chart',
        title: 'Monthly Spending Trend',
        config: { color: '#FF6B35', height: 300 },
        layout: { x: 0, y: 2, w: 8, h: 4 }
      },
      {
        id: 'model-distribution',
        type: 'pie-chart',
        title: 'Model Usage Distribution',
        config: { color: '#059669', showLegend: true, height: 300 },
        layout: { x: 8, y: 2, w: 4, h: 4 }
      }
    ],
    layout: [],
    created: new Date('2025-01-01'),
    updated: new Date('2025-01-01')
  },
  {
    id: 'usage-analytics',
    name: 'Usage Analytics',
    description: 'Detailed usage patterns and performance metrics',
    widgets: [
      {
        id: 'daily-usage-trend',
        type: 'line-chart',
        title: 'Daily Usage Trend',
        config: { color: '#4F46E5', height: 250 },
        layout: { x: 0, y: 0, w: 6, h: 3 }
      },
      {
        id: 'hourly-distribution',
        type: 'bar-chart',
        title: 'Hourly Usage Distribution',
        config: { color: '#059669', height: 250 },
        layout: { x: 6, y: 0, w: 6, h: 3 }
      },
      {
        id: 'token-usage',
        type: 'line-chart',
        title: 'Token Usage Over Time',
        config: { color: '#DC2626', height: 300 },
        layout: { x: 0, y: 3, w: 8, h: 4 }
      },
      {
        id: 'efficiency-metrics',
        type: 'metric-card',
        title: 'Avg. Cost per Session',
        config: { color: '#7C3AED', height: 150 },
        layout: { x: 8, y: 3, w: 4, h: 2 }
      }
    ],
    layout: [],
    created: new Date('2025-01-01'),
    updated: new Date('2025-01-01')
  },
  {
    id: 'cost-optimization',
    name: 'Cost Optimization',
    description: 'Focus on cost analysis and optimization opportunities',
    widgets: [
      {
        id: 'cost-trend',
        type: 'line-chart',
        title: 'Cost Trend Analysis',
        config: { color: '#FF6B35', height: 300 },
        layout: { x: 0, y: 0, w: 8, h: 4 }
      },
      {
        id: 'cost-breakdown',
        type: 'pie-chart',
        title: 'Cost by Model',
        config: { color: '#DC2626', showLegend: true, height: 300 },
        layout: { x: 8, y: 0, w: 4, h: 4 }
      },
      {
        id: 'daily-spend',
        type: 'metric-card',
        title: 'Avg. Daily Spend',
        config: { color: '#FF6B35', height: 120 },
        layout: { x: 0, y: 4, w: 3, h: 2 }
      },
      {
        id: 'efficiency-ratio',
        type: 'metric-card',
        title: 'Cost Efficiency',
        config: { color: '#059669', height: 120 },
        layout: { x: 3, y: 4, w: 3, h: 2 }
      }
    ],
    layout: [],
    created: new Date('2025-01-01'),
    updated: new Date('2025-01-01')
  }
];

export const DashboardTemplates = memo(function DashboardTemplates({
  templates,
  onSelectTemplate,
  onCreateNew,
  onDuplicateTemplate,
  onDeleteTemplate,
  onExportTemplate,
  onImportTemplate,
}: DashboardTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'preset' | 'custom'>('all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');

  // Combine preset and custom templates
  const allTemplates = [...PRESET_TEMPLATES, ...templates];

  // Filter templates based on search and category
  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' ||
                           (selectedCategory === 'preset' && PRESET_TEMPLATES.some(p => p.id === template.id)) ||
                           (selectedCategory === 'custom' && !PRESET_TEMPLATES.some(p => p.id === template.id));
    
    return matchesSearch && matchesCategory;
  });

  const handleImportTemplate = useCallback(() => {
    try {
      const importedTemplate = JSON.parse(importText) as DashboardTemplate;
      
      // Validate the template structure
      if (!importedTemplate.id || !importedTemplate.name || !importedTemplate.widgets) {
        alert('Invalid template format. Please check the JSON structure.');
        return;
      }

      // Generate new ID to avoid conflicts
      importedTemplate.id = `imported-${Date.now()}`;
      importedTemplate.created = new Date();
      importedTemplate.updated = new Date();

      onImportTemplate(importedTemplate);
      setShowImportDialog(false);
      setImportText('');
    } catch (error) {
      alert('Failed to parse template JSON. Please check the format.');
    }
  }, [importText, onImportTemplate]);

  const isPresetTemplate = (templateId: string) => 
    PRESET_TEMPLATES.some(p => p.id === templateId);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Templates</h1>
        <p className="text-gray-400">
          Choose from preset templates or create your own custom dashboard layouts
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex bg-gray-800 border border-gray-600 rounded-lg p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'preset', label: 'Preset' },
            { id: 'custom', label: 'Custom' },
          ].map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                selectedCategory === category.id
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Create New
          </button>
          
          <button
            onClick={() => setShowImportDialog(true)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Upload size={18} />
            Import
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-all"
          >
            {/* Template Preview */}
            <div className="h-32 bg-gray-900 p-3 border-b border-gray-700">
              <div className="grid grid-cols-6 grid-rows-3 gap-1 h-full">
                {template.widgets.slice(0, 6).map((widget, index) => (
                  <div
                    key={widget.id}
                    className="bg-gray-700 rounded-sm flex items-center justify-center"
                    style={{
                      gridColumn: `span ${Math.min(widget.layout.w / 2, 3)}`,
                      gridRow: `span ${Math.min(widget.layout.h / 2, 2)}`,
                    }}
                  >
                    {widget.type === 'line-chart' && <Layout size={8} />}
                    {widget.type === 'pie-chart' && <Grid size={8} />}
                    {widget.type === 'bar-chart' && <Layout size={8} />}
                    {widget.type === 'metric-card' && <Star size={8} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Template Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                  {isPresetTemplate(template.id) && (
                    <span className="inline-block px-2 py-1 bg-orange-600 text-white text-xs rounded mt-1">
                      Preset
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectTemplate(template)}
                    className="p-1.5 hover:bg-gray-700 rounded"
                    title="Use Template"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => onDuplicateTemplate(template.id)}
                    className="p-1.5 hover:bg-gray-700 rounded"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => onExportTemplate(template.id)}
                    className="p-1.5 hover:bg-gray-700 rounded"
                    title="Export"
                  >
                    <Download size={14} />
                  </button>
                  {!isPresetTemplate(template.id) && (
                    <button
                      onClick={() => onDeleteTemplate(template.id)}
                      className="p-1.5 hover:bg-gray-700 rounded text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mb-3">{template.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{template.widgets.length} widgets</span>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {template.updated.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
            <Grid size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">No Templates Found</h3>
            <p className="text-center mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms or create a new template.'
                : 'Get started by creating your first custom dashboard template.'
              }
            </p>
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2"
            >
              <Plus size={16} />
              Create Template
            </button>
          </div>
        )}
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <h3 className="text-lg font-semibold text-white">Import Template</h3>
              <button
                onClick={() => setShowImportDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-gray-300 text-sm mb-3">
                Paste the JSON template configuration below:
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste template JSON here..."
                className="w-full h-40 p-3 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 resize-none"
              />
            </div>
            
            <div className="flex gap-2 p-4 border-t border-gray-600">
              <button
                onClick={handleImportTemplate}
                disabled={!importText.trim()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportText('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});