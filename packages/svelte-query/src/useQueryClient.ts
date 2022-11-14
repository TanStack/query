import type { QueryClient } from '@tanstack/query-core'
import { getQueryClientContext } from './context'

export function useQueryClient(): QueryClient {
  const queryClient = getQueryClientContext()
  return queryClient
}
