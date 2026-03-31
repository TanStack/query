import { getQueryClientContext } from './context.js'
import type { QueryClient } from '@tanstack/query-core'

export function useQueryClient(queryClient?: QueryClient): QueryClient {
  if (queryClient) return queryClient
  return getQueryClientContext()
}
