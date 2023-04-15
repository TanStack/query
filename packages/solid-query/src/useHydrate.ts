import {
  type HydrateOptions,
  type QueryClient,
  hydrate,
} from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'

export function useHydrate(state?: unknown, options?: HydrateOptions) {
  const client: QueryClient = useQueryClient()

  if (state) {
    hydrate(client, state, options)
  }
}
