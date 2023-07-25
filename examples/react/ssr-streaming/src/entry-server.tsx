import { QueryClientProvider } from '@tanstack/react-query'
import { Root } from './Root'
import { createQueryClient } from './query-client'

export function render() {
  /**
   * Create a new router on every request - cannot share caches on server.
   */
  const trackedQueries = new Set<string>()
  const blockingQueries = new Map<string, Promise<void>>()
  const queryClient = createQueryClient({ trackedQueries, blockingQueries })

  const app = (
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  )

  return { app, trackedQueries, blockingQueries, queryClient }
}
