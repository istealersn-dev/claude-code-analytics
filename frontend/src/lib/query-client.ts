import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const errorWithStatus = error as { status: number };
          if (errorWithStatus.status >= 400 && errorWithStatus.status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
    },
  },
})