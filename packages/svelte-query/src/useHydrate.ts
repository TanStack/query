import {
  type HydrateOptions,
  type QueryClient,
  hydrate,
} from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'

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
