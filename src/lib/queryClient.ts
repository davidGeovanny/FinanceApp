import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Financial data must always be fresh:
      // - staleTime 0  → data is considered stale immediately after fetch
      // - refetchOnWindowFocus true  → re-fetch when user switches tabs or navigates back
      // - refetchOnMount true (default) → re-fetch every time a component mounts
      // Catalogs (categories, investmentTypes) override these with longer staleTime.
      staleTime: 0,
      gcTime: 1000 * 60 * 10,   // keep cache in memory 10 min (avoids flash on fast nav)
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
})