import { getQueryClientContext } from './context'
import type { QueryClient } from '@tanstack/query-core'

export function useQueryClient(): QueryClient {
  const queryClient = getQueryClientContext()
  return queryClient
}
