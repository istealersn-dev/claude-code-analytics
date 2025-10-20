import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
  showRetry?: boolean;
  className?: string;
}

export function ErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  showRetry = true,
  className = '',
}: ErrorFallbackProps) {
  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="h-6 w-6" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <p className="text-red-700 max-w-md">{message}</p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="w-full max-w-md">
            <summary className="text-sm text-red-600 cursor-pointer hover:text-red-700 mb-2">
              Error Details (Development)
            </summary>
            <div className="bg-red-100 rounded p-3 text-xs text-red-800 overflow-auto max-h-32 text-left">
              <div className="font-mono">
                <div className="font-semibold">Error:</div>
                <div className="mb-2">{error.message}</div>
                <div className="font-semibold">Stack:</div>
                <div className="whitespace-pre-wrap">{error.stack}</div>
              </div>
            </div>
          </details>
        )}

        {showRetry && (
          <button
            onClick={handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Specialized error fallbacks for different contexts
export function ChartErrorFallback({ error, resetError }: { error?: Error; resetError?: () => void }) {
  return (
    <ErrorFallback
      error={error}
      resetError={resetError}
      title="Chart Error"
      message="Failed to load chart data. This might be due to a network issue or data processing error."
      className="h-64 flex items-center justify-center"
    />
  );
}

export function DataErrorFallback({ error, resetError }: { error?: Error; resetError?: () => void }) {
  return (
    <ErrorFallback
      error={error}
      resetError={resetError}
      title="Data Loading Error"
      message="Unable to load data. Please check your connection and try again."
      className="min-h-32"
    />
  );
}

export function SyncErrorFallback({ error, resetError }: { error?: Error; resetError?: () => void }) {
  return (
    <ErrorFallback
      error={error}
      resetError={resetError}
      title="Sync Error"
      message="Data synchronization failed. Please try again or contact support if the issue persists."
      className="min-h-24"
    />
  );
}
