'use client'
import * as React from 'react'

import { hydrate } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import { IsHydratingProvider } from './IsHydratingProvider'
import type {
  DehydratedState,
  HydrateOptions,
  OmitKeyof,
  QueryClient,
} from '@tanstack/query-core'

// Stable empty set shared as the context value once hydration has completed,
// so consumers never see stale pending flags and we avoid allocating per render.
const EMPTY_HYDRATING_QUERIES: ReadonlySet<string> = new Set()

// Splits the dehydrated queries into those that are new to the cache and those
// that already exist but carry newer data, and derives the pending set from the
// latter. Reads the cache but performs no mutation, so it is a pure function of
// its arguments and safe to call during render.
const classifyQueries = (
  client: QueryClient,
  state: DehydratedState | null | undefined,
) => {
  if (!state || typeof state !== 'object') {
    return {
      newQueries: [] as DehydratedState['queries'],
      existingQueries: [] as DehydratedState['queries'],
      pendingQueries: EMPTY_HYDRATING_QUERIES,
    }
  }

  const queryCache = client.getQueryCache()
  // State is supplied from the outside and we might as well fail
  // gracefully if it has the wrong shape, so while we type `queries`
  // as required, we still provide a fallback.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const queries = state.queries || []

  const newQueries: DehydratedState['queries'] = []
  const existingQueries: DehydratedState['queries'] = []
  for (const dehydratedQuery of queries) {
    const existingQuery = queryCache.get(dehydratedQuery.queryHash)

    if (!existingQuery) {
      newQueries.push(dehydratedQuery)
    } else {
      const hydrationIsNewer =
        dehydratedQuery.state.dataUpdatedAt >
          existingQuery.state.dataUpdatedAt ||
        (dehydratedQuery.promise &&
          existingQuery.state.status !== 'pending' &&
          existingQuery.state.fetchStatus !== 'fetching' &&
          dehydratedQuery.dehydratedAt > existingQuery.state.dataUpdatedAt)

      if (hydrationIsNewer) {
        existingQueries.push(dehydratedQuery)
      }
    }
  }

  // Reuse a stable empty set when nothing is pending so the context value keeps
  // a stable reference and consumers don't recompute needlessly.
  const pendingQueries =
    existingQueries.length > 0
      ? new Set(existingQueries.map((query) => query.queryHash))
      : EMPTY_HYDRATING_QUERIES

  return { newQueries, existingQueries, pendingQueries }
}

/**
 * The props accepted by `HydrationBoundary`.
 */
export interface HydrationBoundaryProps {
  /**
   * The state to hydrate.
   */
  state: DehydratedState | null | undefined
  /**
   * Optional. Note: unlike `hydrate`, `mutations` cannot be set here.
   */
  options?: OmitKeyof<HydrateOptions, 'defaultOptions'> & {
    defaultOptions?: OmitKeyof<
      Exclude<HydrateOptions['defaultOptions'], undefined>,
      'mutations'
    >
  }
  /**
   * The components to render — always rendered unconditionally, not gated on hydration. New queries are
   * hydrated into the cache during render; for queries that already exist in the cache, only newer dehydrated
   * data is hydrated, and that happens in an effect after commit, so `children` may render briefly before it
   * lands.
   */
  children?: React.ReactNode
  /**
   * Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will be used.
   */
  queryClient?: QueryClient
}

/**
 * `HydrationBoundary` adds a previously dehydrated state into the `queryClient` that would be returned by
 * `useQueryClient()`. If the client already contains data, the new queries will be intelligently merged based on
 * update timestamp.
 *
 * Note: Only `queries` can be dehydrated with an `HydrationBoundary`.
 *
 * Queries being hydrated don't refetch on mount while their data is still fresh (within `staleTime`). If the
 * hydrated data is stale (e.g. from cached markup), they refetch as usual. Set `refetchOnMount` to `'always'`
 * to always refetch.
 * @param props - The dehydrated `state` to hydrate, the hydrate `options`, an optional custom
 * `queryClient`, and the `children` to render.
 * @returns The provided `children`, rendered unconditionally. New queries in `state` are hydrated into the
 * cache during render; for queries already in the cache, only newer dehydrated data is hydrated, in an effect
 * after commit.
 * @example
 * ```tsx
 * import { HydrationBoundary } from '@tanstack/react-query'
 *
 * function App() {
 *   return <HydrationBoundary state={dehydratedState}>...</HydrationBoundary>
 * }
 * ```
 * @example
 * Server-side prefetch handed off to the client via `dehydrate`:
 * ```tsx
 * import { HydrationBoundary, dehydrate, noop } from '@tanstack/react-query'
 *
 * async function ServerComponent() {
 *   const queryClient = getQueryClient()
 *
 *   await queryClient
 *     .query({
 *       queryKey: ['posts'],
 *       queryFn: fetchPosts,
 *     })
 *     .catch(noop)
 *
 *   return (
 *     <HydrationBoundary state={dehydrate(queryClient)}>
 *       <Posts />
 *     </HydrationBoundary>
 *   )
 * }
 * ```
 */
export const HydrationBoundary = ({
  children,
  options = {},
  state,
  queryClient,
}: HydrationBoundaryProps) => {
  const client = useQueryClient(queryClient)

  const optionsRef = React.useRef(options)
  React.useEffect(() => {
    optionsRef.current = options
  })

  // Side effects that must only run when `state` changes, not on every render:
  // hydrate brand new queries immediately (in render, before children render, so
  // they can prerender) and defer existing queries to the effect below.
  //
  // For any queries that already exist in the cache, we want to hold back on
  // hydrating until _after_ the render phase. The reason for this is that during
  // transitions, we don't want the existing queries and observers to update to
  // the new data on the current page, only _after_ the transition is committed.
  // If the transition is aborted, we will have hydrated any _new_ queries, but
  // we throw away the fresh data for any existing ones to avoid unexpectedly
  // updating the UI.
  const hydrationQueue = React.useMemo(() => {
    const { newQueries, existingQueries } = classifyQueries(client, state)

    if (newQueries.length > 0) {
      // It's actually fine to call this with queries/state that already exists
      // in the cache, or is older. hydrate() is idempotent for queries.
      // eslint-disable-next-line react-hooks/refs
      hydrate(client, { queries: newQueries }, optionsRef.current)
    }

    return existingQueries.length > 0 ? existingQueries : undefined
  }, [client, state])

  // The pending set drives `_isHydrating` for consumers, which is read per
  // observer at mount. It must be recomputed on every render (not memoized on
  // `state` identity) so that once the deferred hydration lands and the cache
  // catches up, the query is no longer classified as newer and the flag clears
  // for any observer mounting afterwards.
  const { pendingQueries } = classifyQueries(client, state)

  React.useEffect(() => {
    if (hydrationQueue) {
      hydrate(client, { queries: hydrationQueue }, optionsRef.current)
    }
  }, [client, hydrationQueue])

  return (
    <IsHydratingProvider value={pendingQueries}>{children}</IsHydratingProvider>
  )
}
