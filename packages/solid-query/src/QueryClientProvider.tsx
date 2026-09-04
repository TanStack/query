import { createContext, onCleanup, sharedConfig, useContext } from 'solid-js'
import { REVALIDATE_HEADER } from '@solidjs/web'
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
 *
 * A mutation can additionally declare its invalidation SCOPE with
 * `X-Revalidate` keys (the `revalidate` option of Solid's `reload`/
 * `redirect` response helpers). The payload covers the slice of that scope
 * the server could recompute; whatever a declared key matches beyond it is
 * swept client-side (see the consumer below). For the sweep to be
 * delivered, the collector must contribute a slice — return the dehydrated
 * state even when it holds no queries if `outcome.revalidateKeys` is
 * present, rather than skipping the source.
 */
export const FLIGHT_DATA_SOURCE = 'sq'

/**
 * The client half of key-scoped invalidation. A mutation declares its
 * invalidation scope with `X-Revalidate` keys; the flight payload covers
 * the part of that scope the server's collector recomputed (typically the
 * target page's loader graph). Whatever a declared key matches BEYOND the
 * payload — parameterized instances only this client holds, queries no
 * loader owns — is invalidated here: active queries refetch in the
 * background, inactive ones are marked stale for their next mount. This
 * mirrors how Solid Router consumes the same header for its own cache.
 *
 * A key matches by queryKey prefix — `revalidate: 'users'` sweeps every
 * query whose key begins with `'users'`. Payload-covered hashes are exempt:
 * they hydrated with fresh data a moment ago, and refetching them would
 * spend the round trip single flight just saved.
 */
function sweepRevalidatedQueries(
  client: QueryClient,
  payload: DehydratedState,
  response: Response,
): void {
  const keys = response.headers.get(REVALIDATE_HEADER)?.split(',')
  if (!keys) return
  const covered = new Set(payload.queries.map((query) => query.queryHash))
  for (const key of keys) {
    client
      .invalidateQueries({
        queryKey: [key],
        predicate: (query) => !covered.has(query.queryHash),
      })
      // Background refetch failures surface through the queries' own error
      // states; an unhandled rejection here would fail the mutation instead.
      .catch(() => undefined)
  }
}

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
  // The standard dehydrate filter gates the wire here too, so apps keep
  // sensitive or oversized queries out of the HTML with the same option
  // they'd pass any other transport.
  const shouldDehydrateQuery =
    client.getDefaultOptions().dehydrate?.shouldDehydrateQuery
  const seen = new Set<string>()
  const serializeQuery = (query: Query<any, any, any, any>) => {
    if (seen.has(query.queryHash)) return
    // Consulted per cache event until it passes, so a filter that rejects
    // pending queries (e.g. the core default) still admits the settled
    // value if it lands while the request's serialization context is live.
    if (shouldDehydrateQuery && !shouldDehydrateQuery(query)) return
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
    // Render disposal ends the request: abort what's still in flight and
    // drop the cache so user-configured finite gcTime timers can't pin
    // the per-request client (and whatever its queries closed over) until
    // they fire. Serialized promises are already in seroval's hands, so
    // clearing here can't affect the streamed payload.
    onCleanup(() => {
      props.client.cancelQueries().catch(() => undefined)
      props.client.clear()
    })
  } else {
    // Client-only: the server's consumer registry is module state shared
    // across requests — registering there would leak between them.
    onCleanup(
      subscribeFlightData<DehydratedState>(
        FLIGHT_DATA_SOURCE,
        (data, context) => {
          hydrate(props.client, data)
          // Fresh data first, then the declared-scope sweep: stale marks
          // land synchronously, refetches run in the background — the
          // mutation's promise never waits on them.
          sweepRevalidatedQueries(props.client, data, context.response)
        },
      ),
    )
  }

  return (
    <QueryClientContext value={() => props.client}>
      {props.children}
    </QueryClientContext>
  )
}
