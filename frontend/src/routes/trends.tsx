import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import { TrendAnalysisDashboard } from '../components/trends/TrendAnalysisDashboard';
import { CostOptimizationDashboard } from '../components/trends/CostOptimizationDashboard';

function TrendsPage() {
  const { dateFrom, dateTo } = Route.useSearch();
  
  const filters = {
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Advanced Analytics</h1>
        <p className="text-gray-400">
          Gain deeper insights into your Claude Code usage patterns and optimize costs
        </p>
      </div>

      {/* Trend Analysis Section */}
      <section>
        <TrendAnalysisDashboard filters={filters} />
      </section>

      {/* Cost Optimization Section */}
      <section>
        <CostOptimizationDashboard filters={filters} />
      </section>
    </div>
  );
}

export const Route = createFileRoute('/trends')({
  component: TrendsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      dateFrom: search.dateFrom as string | undefined,
      dateTo: search.dateTo as string | undefined,
    };
  },
});