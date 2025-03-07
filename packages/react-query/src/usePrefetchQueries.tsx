import { useQueryClient } from './QueryClientProvider'
import type { FetchQueryOptions, QueryClient } from '@tanstack/query-core'

export function usePrefetchQueries(
  options: {
    queries: ReadonlyArray<FetchQueryOptions<any, any, any, any>>
  },
  queryClient?: QueryClient,
) {
  const client = useQueryClient(queryClient)

  for (const query of options.queries) {
    if (!client.getQueryState(query.queryKey)) {
      client.prefetchQuery(query)
    }
  }
}
