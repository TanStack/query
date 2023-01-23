import type { QueryClient } from '@tanstack/query-core'
import { getQueryClientContext } from './context'

export function useQueryClient(queryClient?: QueryClient): QueryClient {
  const client = getQueryClientContext()

  if (queryClient) {
    return queryClient
  }

  return client
}
