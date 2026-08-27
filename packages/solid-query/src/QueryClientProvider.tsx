import { createContext, onCleanup, useContext } from 'solid-js'
import type { QueryClient } from './QueryClient'
import type { JSX } from '@solidjs/web'

export const QueryClientContext = createContext<(() => QueryClient) | null>(
  null,
)

export const useQueryClient = (queryClient?: QueryClient) => {
  if (queryClient) {
    return queryClient
  }
  const client = useContext(QueryClientContext)

  if (!client) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return client()
}

export type QueryClientProviderProps = {
  client: QueryClient
  children?: JSX.Element
}

/**
 * Provides the QueryClient and manages its mount lifecycle. There is no
 * SSR serialization machinery here: each query hook's data node serializes
 * its own settled payload through Solid's per-computation hydration
 * channel, and hydrated hooks prime the cache from their own node entry —
 * see `useBaseQuery`.
 */
export const QueryClientProvider = (
  props: QueryClientProviderProps,
): JSX.Element => {
  props.client.mount()
  onCleanup(() => props.client.unmount())

  return (
    <QueryClientContext value={() => props.client}>
      {props.children}
    </QueryClientContext>
  )
}
