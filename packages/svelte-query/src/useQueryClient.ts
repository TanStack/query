import type { QueryClient } from '@tanstack/query-core'
import { getQueryClientContext } from './context'

export function useQueryClient(queryClient?: QueryClient): QueryClient {
  if (queryClient) return queryClient
  return getQueryClientContext()
}
