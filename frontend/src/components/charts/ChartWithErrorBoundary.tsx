import { ErrorBoundary } from '../ErrorBoundary';
import { ChartErrorFallback } from '../ErrorFallback';

interface ChartWithErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export function ChartWithErrorBoundary({ 
  children
}: ChartWithErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <ChartErrorFallback 
          error={undefined}
          resetError={undefined}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}
