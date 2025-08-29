const API_BASE_URL = '/api'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Unknown error')
  }
}

export const api = {
  // Health endpoints
  health: {
    check: () => apiRequest('/health'),
    database: () => apiRequest('/health/db'),
  },
  
  // Analytics endpoints
  analytics: {
    summary: (params?: Record<string, any>) => 
      apiRequest(`/analytics/summary${params ? '?' + new URLSearchParams(params) : ''}`),
    usage: (params?: Record<string, any>) => 
      apiRequest(`/analytics${params ? '?' + new URLSearchParams(params) : ''}`),
    costs: (params?: Record<string, any>) => 
      apiRequest(`/analytics/costs${params ? '?' + new URLSearchParams(params) : ''}`),
    tokens: (params?: Record<string, any>) => 
      apiRequest(`/analytics/tokens${params ? '?' + new URLSearchParams(params) : ''}`),
    sessions: (params?: Record<string, any>) => 
      apiRequest(`/analytics/sessions${params ? '?' + new URLSearchParams(params) : ''}`),
  },
  
  // Sync endpoints
  sync: {
    status: () => apiRequest('/sync/status'),
    run: (options?: { incremental?: boolean; dryRun?: boolean }) => 
      apiRequest('/sync/run', {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }),
    preview: () => apiRequest('/sync/preview'),
  },
  
  // Retention endpoints
  retention: {
    stats: () => apiRequest('/retention/stats'),
    clean: (options?: { dryRun?: boolean }) => 
      apiRequest('/retention/clean', {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }),
  },
}