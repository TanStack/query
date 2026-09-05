import { hydrate } from '@tanstack/query-core'
import type {
  DehydratedState,
  HydrateOptions,
  OmitKeyof,
  QueryClient,
} from '@tanstack/query-core'
import { Fragment } from 'preact'
import type { ComponentChildren } from 'preact'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'preact/hooks'

import { useIsRestoring } from './IsRestoringProvider'
import { useQueryClient } from './QueryClientProvider'

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
  children?: ComponentChildren
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
 * @returns The provided `children`, rendered unconditionally. New queries in `state` are hydrated into the
 * cache during render; for queries already in the cache, only newer dehydrated data is hydrated, in an effect
 * after commit.
 *
 * @example
 * ```tsx
 * import { HydrationBoundary } from '@tanstack/preact-query'
 *
 * function App() {
 *   return <HydrationBoundary state={dehydratedState}>...</HydrationBoundary>
 * }
 * ```
 *
 * @example
 * Server-side prefetch handed off to the client via `dehydrate`:
 * ```tsx
 * import { HydrationBoundary, dehydrate, noop } from '@tanstack/preact-query'
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
  const isRestoring = useIsRestoring()

  const optionsRef = useRef(options)
  useLayoutEffect(() => {
    optionsRef.current = options
  })

  // This useMemo is for performance reasons only, everything inside it must
  // be safe to run in every render and code here should be read as "in render".
  //
  // This code needs to happen during the render phase, because after initial
  // SSR, hydration needs to happen _before_ children render. Also, if hydrating
  // during a transition, we want to hydrate as much as is safe in render so
  // we can prerender as much as possible.
  //
  // For any queries that already exist in the cache, we want to hold back on
  // hydrating until _after_ the render phase. The reason for this is that during
  // transitions, we don't want the existing queries and observers to update to
  // the new data on the current page, only _after_ the transition is committed.
  // If the transition is aborted, we will have hydrated any _new_ queries, but
  // we throw away the fresh data for any existing ones to avoid unexpectedly
  // updating the UI.
  //
  // Queries with no subscribers are the exception, they are hydrated as soon as
  // the tree commits, see the layout effect below.
  const hydrationQueue: DehydratedState['queries'] | undefined = useMemo(() => {
    if (state) {
      if (typeof state !== 'object') {
        return
      }

      const queryCache = client.getQueryCache()
      // State is supplied from the outside and we might as well fail
      // gracefully if it has the wrong shape, so while we type `queries`
      // as required, we still provide a fallback.
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
              dehydratedQuery.dehydratedAt !== undefined &&
              dehydratedQuery.dehydratedAt > existingQuery.state.dataUpdatedAt)

          if (hydrationIsNewer) {
            existingQueries.push(dehydratedQuery)
          }
        }
      }

      if (newQueries.length > 0) {
        // It's actually fine to call this with queries/state that already exists
        // in the cache, or is older. hydrate() is idempotent for queries.
        hydrate(client, { queries: newQueries }, optionsRef.current)
      }
      if (existingQueries.length > 0) {
        return existingQueries
      }
    }
    return undefined
  }, [client, state])

  // What the layout effect below leaves for the passive one, so that a query
  // isn't hydrated, and its data deserialized, twice for the same commit.
  const deferredRef = useRef<DehydratedState['queries'] | undefined>(undefined)

  // Waiting for a passive effect is too late for a query with no subscribers.
  // Children subscribe to the cache from their own passive effects and those
  // run before the parent's, so a query that remounts under this boundary reads
  // the old entry, finds it stale and refetches the very data we are holding.
  // A query nobody subscribed to is also a query nobody gets notified about, so
  // hydrating it as the tree commits doesn't update anything on the page, which
  // is the only reason existing queries wait in the first place.
  //
  // While restoring, subscriptions are held back on purpose and that reasoning
  // no longer applies, so everything waits for the passive effect.
  useLayoutEffect(() => {
    if (!hydrationQueue || isRestoring) {
      deferredRef.current = hydrationQueue
      return
    }

    const queryCache = client.getQueryCache()
    const unobserved: DehydratedState['queries'] = []
    const observed: DehydratedState['queries'] = []

    for (const dehydratedQuery of hydrationQueue) {
      const query = queryCache.get(dehydratedQuery.queryHash)

      if (!query || query.getObserversCount() === 0) {
        unobserved.push(dehydratedQuery)
      } else {
        observed.push(dehydratedQuery)
      }
    }

    deferredRef.current = observed

    if (unobserved.length > 0) {
      hydrate(client, { queries: unobserved }, optionsRef.current)
    }
  }, [client, hydrationQueue, isRestoring])

  // Queries with subscribers keep waiting, so a render that ends up being
  // thrown away, because something in it suspended, leaves the page the user is
  // looking at alone.
  useEffect(() => {
    const deferred = deferredRef.current

    if (deferred && deferred.length > 0) {
      hydrate(client, { queries: deferred }, optionsRef.current)
    }
  }, [client, hydrationQueue, isRestoring])

  return <Fragment>{children}</Fragment>
}
