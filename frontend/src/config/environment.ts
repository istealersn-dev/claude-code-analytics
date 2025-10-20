/**
 * Environment configuration for Claude Code Analytics
 * Centralizes all environment variables and provides fallbacks
 */

export interface EnvironmentConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

/**
 * Get the API base URL from environment variables with fallbacks
 */
function getApiBaseUrl(): string {
  // Check for VITE_API_BASE_URL first (Vite environment variable)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Check for REACT_APP_API_BASE_URL (Create React App convention)
  if (import.meta.env.REACT_APP_API_BASE_URL) {
    return import.meta.env.REACT_APP_API_BASE_URL;
  }

  // Development fallback
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api';
  }

  // Production fallback - use relative path for same-origin requests
  return '/api';
}

/**
 * Environment configuration object
 */
export const env: EnvironmentConfig = {
  apiBaseUrl: getApiBaseUrl(),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isTest: import.meta.env.MODE === 'test',
};

/**
 * Validate environment configuration
 */
export function validateEnvironment(): void {
  if (!env.apiBaseUrl) {
    throw new Error('API base URL is not configured');
  }

  if (env.isDevelopment && env.apiBaseUrl === '/api') {
    console.warn(
      'Warning: Using relative API path in development. Make sure the backend is running on the same port as the frontend.',
    );
  }
}

/**
 * Get API endpoint URL
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If apiBaseUrl already ends with /api, don't add it again
  if (env.apiBaseUrl.endsWith('/api')) {
    return `${env.apiBaseUrl}/${cleanEndpoint}`;
  }
  
  return `${env.apiBaseUrl}/api/${cleanEndpoint}`;
}

/**
 * Log environment configuration (development only)
 */
export function logEnvironmentConfig(): void {
  if (env.isDevelopment) {
    console.log('🔧 Environment Configuration:', {
      apiBaseUrl: env.apiBaseUrl,
      mode: import.meta.env.MODE,
      isDevelopment: env.isDevelopment,
      isProduction: env.isProduction,
    });
  }
}
