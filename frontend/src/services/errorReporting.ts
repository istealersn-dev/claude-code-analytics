interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  errorId: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  additionalInfo?: Record<string, unknown>;
}

interface ErrorReportingService {
  captureException(error: Error, context?: Record<string, unknown>): void;
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
  setUser(userId: string, userInfo?: Record<string, unknown>): void;
  setContext(key: string, value: unknown): void;
}

class ErrorReportingServiceImpl implements ErrorReportingService {
  // private userInfo: Record<string, any> = {};
  private context: Record<string, unknown> = {};

  captureException(error: Error, additionalContext?: Record<string, unknown>): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      errorId: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalInfo: {
        ...this.context,
        ...additionalContext,
      },
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Report:', errorReport);
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorReport(errorReport);
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const report: ErrorReport = {
      message,
      errorId: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalInfo: {
        level,
        ...this.context,
      },
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${level.toUpperCase()} Report:`, report);
    }

    if (process.env.NODE_ENV === 'production') {
      this.sendErrorReport(report);
    }
  }

  setUser(userId: string, userInfo?: Record<string, unknown>): void {
    // this.userInfo = { userId, ...userInfo };
    console.log('User set:', userId, userInfo);
  }

  setContext(key: string, value: unknown): void {
    this.context[key] = value;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      // In a real application, you would send this to an error reporting service
      // like Sentry, LogRocket, Bugsnag, or your own error tracking API
      
      // Example: Send to your own API endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });

      // Example: Send to Sentry
      // Sentry.captureException(error, { extra: report });

      // For now, just log to console in production
      console.error('📊 Error Report (Production):', report);
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }
}

// Singleton instance
export const errorReportingService = new ErrorReportingServiceImpl();

// React hook for error reporting
export function useErrorReporting() {
  return {
    captureException: errorReportingService.captureException.bind(errorReportingService),
    captureMessage: errorReportingService.captureMessage.bind(errorReportingService),
    setUser: errorReportingService.setUser.bind(errorReportingService),
    setContext: errorReportingService.setContext.bind(errorReportingService),
  };
}

// Utility function for wrapping async functions with error reporting
export function withErrorReporting<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorReportingService.captureException(error as Error, {
        function: fn.name,
        context,
        arguments: args,
      });
      throw error;
    }
  };
}

// Utility function for wrapping sync functions with error reporting
export function withErrorReportingSync<T extends unknown[], R>(
  fn: (...args: T) => R,
  context?: string
): (...args: T) => R {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      errorReportingService.captureException(error as Error, {
        function: fn.name,
        context,
        arguments: args,
      });
      throw error;
    }
  };
}
