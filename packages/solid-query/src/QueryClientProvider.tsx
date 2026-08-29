import { createContext, onCleanup, sharedConfig, useContext } from 'solid-js'
import { hydrate } from '@tanstack/query-core'
import { subscribeFlightData } from '@solidjs/web/server-functions'
import type { DehydratedState, Query } from '@tanstack/query-core'
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

/**
 * The query cache's single-flight source id. Mutation responses can fold
 * fresh data for multiple caches at once (Solid's multi-source
 * single-flight protocol); this is the slice the query cache claims — the
 * provider subscribes its consumer under it, and server collectors
 * register under it to produce the data:
 *
 * ```ts
 * import { registerFlightDataSource } from '@solidjs/web/server-functions/server'
 * import { FLIGHT_DATA_SOURCE, dehydrate } from '@tanstack/solid-query'
 *
 * registerFlightDataSource(FLIGHT_DATA_SOURCE, async (event, outcome) => {
 *   // rebuild the data for outcome.targetUrl into a QueryClient, then
 *   return dehydrate(queryClient)
 * })
 * ```
 *
 * The slice's payload is a `DehydratedState`; the provider consumes it
 * with `hydrate()`, so every mounted query on those keys updates before
 * the mutation's promise resolves — no follow-up refetches.
 */
export const FLIGHT_DATA_SOURCE = 'sq'

// The named-source overload of subscribeFlightData ships in the
// @solidjs/web release after 2.0.0-rc.4 (solidjs/solid#653dd41e); this
// cast bridges the installed types until the peer range bumps.
const subscribeFlightSource = subscribeFlightData as unknown as (
  source: string,
  consumer: (
    data: DehydratedState,
    context: { response: Response },
  ) => void | Promise<void>,
) => () => void

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
 * the cache from their hash-keyed registry entries themselves (see
 * `useBaseQuery`) and the provider subscribes the cache's single-flight
 * consumer: mutation responses carrying a `FLIGHT_DATA_SOURCE` slice (a
 * `DehydratedState` produced by a server collector registered under the
 * same id) hydrate this client before the mutation's promise resolves.
 * Subscribing is inert when no server collector exists — the server just
 * folds nothing — so it is unconditional. One consumer per source: with
 * nested providers, the innermost mounted one owns the slice.
 */
export const QueryClientProvider = (
  props: QueryClientProviderProps,
): JSX.Element => {
  props.client.mount()
  onCleanup(() => props.client.unmount())
  if (isServer) {
    serializeCacheOnServer(props.client)
  } else {
    // Client-only: the server's consumer registry is module state shared
    // across requests — registering there would leak between them.
    onCleanup(
      subscribeFlightSource(FLIGHT_DATA_SOURCE, (data) => {
        hydrate(props.client, data)
      }),
    )
  }

  return (
    <QueryClientContext value={() => props.client}>
      {props.children}
    </QueryClientContext>
  )
}
