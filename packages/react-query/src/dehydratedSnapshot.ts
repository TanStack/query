'use client'
import { QueryClient } from '@tanstack/query-core'
import * as React from 'react'
import type {
  DefaultedQueryObserverOptions,
  DehydratedState,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'

/**
 * Finds the client that holds a query exactly as the nearest `HydrationBoundary` received it. That
 * state is the only thing the server render and the hydrating client share, so hooks read it as
 * their server snapshot. Returns `undefined` for a query that no boundary carries.
 */
export type DehydratedSnapshot = (queryHash: string) => QueryClient | undefined

export const DehydratedSnapshotContext = React.createContext<
  DehydratedSnapshot | undefined
>(undefined)

/**
 * Creates the snapshot of one `HydrationBoundary`. Its client is built on first use, which only
 * happens on the server and while hydrating.
 * @param state - The dehydrated state the boundary received.
 * @param getDeserializeData - Reads the transform that reverses `serializeData`, if any.
 * @param parent - The snapshot of the enclosing boundary, asked for queries this state lacks.
 * @returns A lookup from a query hash to the client that holds that query as dehydrated.
 */
export function createDehydratedSnapshot(
  state: DehydratedState,
  getDeserializeData: () => ((data: any) => any) | undefined,
  parent: DehydratedSnapshot | undefined,
): DehydratedSnapshot {
  let client: QueryClient | undefined

  return (queryHash) => {
    const dehydratedQuery = state.queries.find(
      (query) => query.queryHash === queryHash,
    )
    if (!dehydratedQuery) {
      return parent?.(queryHash)
    }

    client ??= new QueryClient()
    const queryCache = client.getQueryCache()
    // Deserialize the data once, however many hooks read the query.
    if (!queryCache.get(queryHash)) {
      const { queryKey, meta, queryType } = dehydratedQuery
      const { data } = dehydratedQuery.state
      const deserializeData = getDeserializeData()
      queryCache.build(
        client,
        { queryKey, queryHash, meta, _type: queryType },
        {
          ...dehydratedQuery.state,
          data:
            data !== undefined && deserializeData
              ? deserializeData(data)
              : data,
        },
      )
    }
    return client
  }
}

/**
 * Computes the result a hook has for a query as its `HydrationBoundary` received it.
 * @param snapshot - The snapshot of the nearest boundary.
 * @param Observer - The observer class of the hook.
 * @param options - The defaulted options of the hook.
 * @param liveResult - The result for the real cache, whose methods the returned result keeps.
 * @returns The result, or `undefined` when the hook has to read the real cache.
 */
export function getDehydratedResult(
  snapshot: DehydratedSnapshot,
  Observer: typeof QueryObserver,
  options: DefaultedQueryObserverOptions<any, any, any, any, any>,
  liveResult: QueryObserverResult<any, any>,
): QueryObserverResult<any, any> | undefined {
  const client = snapshot(options.queryHash)
  if (
    !client ||
    // A Suspense hook has waited for data that the dehydrated state may not hold.
    (options.suspense &&
      client.getQueryCache().get(options.queryHash)!.state.data === undefined)
  ) {
    return undefined
  }

  const result: Record<string, unknown> = {
    ...new Observer(client, options).getCurrentResult(),
  }
  // Methods such as `refetch` must act on the real cache.
  for (const key in result) {
    if (typeof result[key] === 'function') {
      result[key] = (liveResult as unknown as Record<string, unknown>)[key]
    }
  }
  return result as unknown as QueryObserverResult<any, any>
}

/**
 * Creates the `getServerSnapshot` of a hook: the result for the dehydrated state when a boundary
 * carries the hook's queries, and the result for the real cache otherwise. React requires the
 * server snapshot to be the same on the server and on the client, and to be cached.
 * @param key - Identifies the queries of the hook.
 * @param getSnapshot - Reads the result for the real cache.
 * @param getDehydrated - Reads the result for the dehydrated state.
 * @returns The `getServerSnapshot` to pass to `useSyncExternalStore`.
 */
export function useGetServerSnapshot<TResult>(
  key: string,
  getSnapshot: () => TResult,
  getDehydrated: (snapshot: DehydratedSnapshot) => TResult | undefined,
): () => TResult {
  const snapshot = React.useContext(DehydratedSnapshotContext)
  const cacheRef = React.useRef<{
    snapshot: DehydratedSnapshot
    key: string
    result: TResult | undefined
  }>(undefined)

  return () => {
    if (!snapshot) {
      return getSnapshot()
    }
    let cached = cacheRef.current
    if (cached?.snapshot !== snapshot || cached.key !== key) {
      cached = { snapshot, key, result: getDehydrated(snapshot) }
      cacheRef.current = cached
    }
    return cached.result ?? getSnapshot()
  }
}
