import { hydrate } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'
import type { HydrateOptions, QueryClient } from '@tanstack/query-core'

export function useHydrate(
  state?: unknown,
  options?: HydrateOptions,
  queryClient?: QueryClient,
) {
  const client = useQueryClient(queryClient)

  if (state) {
    hydrate(client, state, options)
  }
}
