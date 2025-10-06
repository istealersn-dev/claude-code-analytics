import { lazy, Suspense } from 'react';
import type { LineChartProps } from './LineChart';
import type { PieChartProps } from './PieChart';
import type { AreaChartProps } from './AreaChart';
import type { BarChartProps } from './BarChart';
import type { HeatmapChartProps } from './HeatmapChart';
import type { InteractiveLineChartProps } from './InteractiveLineChart';
import type { ChartComparisonProps } from './ChartComparison';
import type { ChartBuilderProps } from './ChartBuilder';

// Lazy load chart components for code splitting
const LazyLineChart = lazy(() =>
  import('./LineChart').then((module) => ({ default: module.LineChart })),
);
const LazyPieChart = lazy(() =>
  import('./PieChart').then((module) => ({ default: module.PieChart })),
);
const LazyAreaChart = lazy(() =>
  import('./AreaChart').then((module) => ({ default: module.AreaChart })),
);
const LazyBarChart = lazy(() =>
  import('./BarChart').then((module) => ({ default: module.BarChart })),
);
const LazyHeatmapChart = lazy(() =>
  import('./HeatmapChart').then((module) => ({ default: module.HeatmapChart })),
);

// Phase 5.5: Interactive Chart Components
const LazyInteractiveLineChart = lazy(() =>
  import('./InteractiveLineChart').then((module) => ({ default: module.InteractiveLineChart })),
);
const LazyChartComparison = lazy(() =>
  import('./ChartComparison').then((module) => ({ default: module.ChartComparison })),
);
const LazyChartBuilder = lazy(() =>
  import('./ChartBuilder').then((module) => ({ default: module.ChartBuilder })),
);

// Loading component for charts
function ChartLoader({ height = 250 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
  );
}

// Wrapped components with Suspense
export function LineChart(props: LineChartProps) {
  return (
    <Suspense fallback={<ChartLoader height={props.height} />}>
      <LazyLineChart {...props} />
    </Suspense>
  );
}

export function PieChart(props: PieChartProps) {
  return (
    <Suspense fallback={<ChartLoader height={props.height} />}>
      <LazyPieChart {...props} />
    </Suspense>
  );
}

export function AreaChart(props: AreaChartProps) {
  return (
    <Suspense fallback={<ChartLoader height={props.height} />}>
      <LazyAreaChart {...props} />
    </Suspense>
  );
}

export function BarChart(props: BarChartProps) {
  return (
    <Suspense fallback={<ChartLoader height={props.height} />}>
      <LazyBarChart {...props} />
    </Suspense>
  );
}

export function HeatmapChart(props: HeatmapChartProps) {
  return (
    <Suspense fallback={<ChartLoader height={props.height} />}>
      <LazyHeatmapChart {...props} />
    </Suspense>
  );
}

// Phase 5.5: Interactive Chart Components
export function InteractiveLineChart(props: InteractiveLineChartProps) {
  return (
    <Suspense fallback={<ChartLoader height={props.height} />}>
      <LazyInteractiveLineChart {...props} />
    </Suspense>
  );
}

export function ChartComparison(props: ChartComparisonProps) {
  return (
    <Suspense fallback={<ChartLoader height={props.height} />}>
      <LazyChartComparison {...props} />
    </Suspense>
  );
}

export function ChartBuilder(props: ChartBuilderProps) {
  return (
    <Suspense fallback={<ChartLoader height={props.height} />}>
      <LazyChartBuilder {...props} />
    </Suspense>
  );
}
