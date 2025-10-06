import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useState } from 'react';
import { DashboardBuilder } from '../components/dashboard/DashboardBuilder';
import type { DashboardTemplate } from '../components/dashboard/DashboardTemplates';
import { DashboardTemplates } from '../components/dashboard/DashboardTemplates';

export const Route = createFileRoute('/dashboard-builder')({
  component: DashboardBuilderPage,
});

function DashboardBuilderPage() {
  const [currentView, setCurrentView] = useState<'templates' | 'builder'>('templates');
  const [currentTemplate, setCurrentTemplate] = useState<DashboardTemplate | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<DashboardTemplate[]>([]);

  const handleSelectTemplate = useCallback((template: DashboardTemplate) => {
    setCurrentTemplate(template);
    setCurrentView('builder');
  }, []);

  const handleCreateNew = useCallback(() => {
    setCurrentTemplate({
      id: `dashboard-${Date.now()}`,
      name: 'New Dashboard',
      description: 'Custom dashboard template',
      widgets: [],
      layout: [],
      created: new Date(),
      updated: new Date(),
    });
    setCurrentView('builder');
  }, []);

  const handleSaveTemplate = useCallback((template: DashboardTemplate) => {
    setSavedTemplates((prev) => {
      const existingIndex = prev.findIndex((t) => t.id === template.id);
      if (existingIndex >= 0) {
        // Update existing template
        const updated = [...prev];
        updated[existingIndex] = template;
        return updated;
      } else {
        // Add new template
        return [...prev, template];
      }
    });

    // Show success message
    alert(`Dashboard "${template.name}" saved successfully!`);
  }, []);

  const handleExportTemplate = useCallback((template: DashboardTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }, []);

  const handleDuplicateTemplate = useCallback(
    (templateId: string) => {
      // Find template from both saved and current template
      let templateToDuplicate: DashboardTemplate | null = null;

      if (currentTemplate?.id === templateId) {
        templateToDuplicate = currentTemplate;
      } else {
        templateToDuplicate = savedTemplates.find((t) => t.id === templateId) || null;
      }

      if (!templateToDuplicate) return;

      const duplicated: DashboardTemplate = {
        ...templateToDuplicate,
        id: `dashboard-${Date.now()}`,
        name: `${templateToDuplicate.name} (Copy)`,
        created: new Date(),
        updated: new Date(),
        widgets: templateToDuplicate.widgets.map((widget) => ({
          ...widget,
          id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })),
      };

      setSavedTemplates((prev) => [...prev, duplicated]);
      alert(`Dashboard "${duplicated.name}" created successfully!`);
    },
    [currentTemplate, savedTemplates],
  );

  const handleDeleteTemplate = useCallback((templateId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this dashboard template? This action cannot be undone.',
      )
    ) {
      setSavedTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
  }, []);

  const handleImportTemplate = useCallback((template: DashboardTemplate) => {
    setSavedTemplates((prev) => [...prev, template]);
    alert(`Dashboard "${template.name}" imported successfully!`);
  }, []);

  const handleBackToTemplates = useCallback(() => {
    setCurrentView('templates');
    setCurrentTemplate(null);
  }, []);

  if (currentView === 'builder' && currentTemplate) {
    return (
      <div className="h-screen bg-gray-900">
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-50">
          <button
            type="button"
            onClick={handleBackToTemplates}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Templates
          </button>
        </div>

        <DashboardBuilder
          initialTemplate={currentTemplate}
          onSave={handleSaveTemplate}
          onExport={handleExportTemplate}
          availableTemplates={savedTemplates}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <DashboardTemplates
        templates={savedTemplates}
        onSelectTemplate={handleSelectTemplate}
        onCreateNew={handleCreateNew}
        onDuplicateTemplate={handleDuplicateTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onExportTemplate={handleExportTemplate}
        onImportTemplate={handleImportTemplate}
      />
    </div>
  );
}
