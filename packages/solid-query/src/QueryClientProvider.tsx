import { createContext, onCleanup, sharedConfig, useContext } from 'solid-js'
import type { Query } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type { JSX } from '@solidjs/web'

const isServer = typeof window === 'undefined'

/**
 * Namespace prefix for cache entries in Solid's hydration registry — the
 * registry is shared with positional node ids and other libraries'
 * content-addressed keys (Solid Router uses its own cache keys), so query
 * hashes get their own prefix.
 */
export const HYDRATION_KEY_PREFIX = 'sq:'

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
 * Server side of hydration: serialize every query the request touches into
 * Solid's hydration registry, content-addressed by query hash (the Solid
 * Router `query()` pattern). Serialization happens at fetch-DISPATCH time —
 * synchronously, while the request's serialization context is live — by
 * handing seroval the fetch promise; it streams the `{ data, t }` payload
 * whenever the fetch settles. Settled entries (initialData, setQueryData,
 * loader prefetches that already landed) serialize their value directly.
 *
 * Content addressing is what makes this cover MORE than rendered
 * components: a query prefetched in a loader and never read by any
 * component still transfers, and any client hook (hydrating or mounted
 * long after) finds it by hash. One entry per hash regardless of how many
 * hooks read it; the payload object is the same reference the data nodes
 * serialize, so seroval's cross-reference dedupe emits it once.
 */
function serializeCacheOnServer(client: QueryClient): void {
  const ctx = (
    sharedConfig as unknown as {
      context?: {
        async?: boolean
        noHydrate?: boolean
        serialize: (key: string, value: unknown) => void
      }
    }
  ).context
  if (!ctx || !ctx.async || ctx.noHydrate) return

  const cache = client.getQueryCache()
  const seen = new Set<string>()
  const serializeQuery = (query: Query<any, any, any, any>) => {
    if (seen.has(query.queryHash)) return
    const state = query.state
    if (state.status === 'success') {
      seen.add(query.queryHash)
      ctx.serialize(HYDRATION_KEY_PREFIX + query.queryHash, {
        data: state.data,
        t: state.dataUpdatedAt,
      })
    } else if (state.fetchStatus !== 'idle') {
      // Serialize the PROMISE now, while the context is live — the settle
      // event fires from IO, where no request context exists anymore.
      const promise = query.promise as Promise<unknown> | undefined
      if (!promise) return
      seen.add(query.queryHash)
      ctx.serialize(
        HYDRATION_KEY_PREFIX + query.queryHash,
        promise.then(() => ({
          data: query.state.data,
          t: query.state.dataUpdatedAt,
        })),
      )
    }
  }

  for (const query of cache.getAll()) serializeQuery(query)
  onCleanup(cache.subscribe((event) => serializeQuery(event.query)))
}

/**
 * Provides the QueryClient and manages its mount lifecycle. On the server
 * it also registers the cache serializer above; on the client, hooks prime
 * the cache from their hash-keyed registry entries themselves — see
 * `useBaseQuery`.
 */
export const QueryClientProvider = (
  props: QueryClientProviderProps,
): JSX.Element => {
  props.client.mount()
  onCleanup(() => props.client.unmount())
  if (isServer) serializeCacheOnServer(props.client)

  return (
    <QueryClientContext value={() => props.client}>
      {props.children}
    </QueryClientContext>
  )
}
