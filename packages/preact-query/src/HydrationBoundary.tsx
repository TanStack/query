import { hydrate } from '@tanstack/query-core'
import { Fragment } from 'preact'
import { useEffect, useMemo, useRef } from 'preact/hooks'
import { useQueryClient } from './QueryClientProvider'
import type {
  DehydratedState,
  HydrateOptions,
  OmitKeyof,
  QueryClient,
} from '@tanstack/query-core'
import type { ComponentChildren } from 'preact'

/**
 * The props accepted by `HydrationBoundary`.
 */
export interface HydrationBoundaryProps {
  /**
   * The state to hydrate. Pass the result of `dehydrate(queryClient)`.
   */
  state: DehydratedState
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
 * @param props - The dehydrated `state` to hydrate, the hydrate `options`, an optional custom
 * `queryClient`, and the `children` to render.
 * @returns The provided `children`, rendered unconditionally. New queries in `state` are hydrated into the
 * cache during render; for queries already in the cache, only newer dehydrated data is hydrated, in an effect
 * after commit.
 * @example
 * ```tsx
 * import { HydrationBoundary } from '@tanstack/preact-query'
 *
 * function App() {
 *   return <HydrationBoundary state={dehydratedState}>...</HydrationBoundary>
 * }
 * ```
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

  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  // Hydrate new queries during render so children can read their data.
  // Hydrate existing queries after commit so an aborted transition cannot update them.
  const hydrationQueue: DehydratedState['queries'] | undefined = useMemo(() => {
    const queryCache = client.getQueryCache()

    const newQueries: DehydratedState['queries'] = []
    const existingQueries: DehydratedState['queries'] = []
    for (const dehydratedQuery of state.queries) {
      const existingQuery = queryCache.get(dehydratedQuery.queryHash)

      if (!existingQuery) {
        newQueries.push(dehydratedQuery)
        continue
      }

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

    if (newQueries.length > 0) {
      hydrate(client, { queries: newQueries }, optionsRef.current)
    }
    return existingQueries.length > 0 ? existingQueries : undefined
  }, [client, state])

  useEffect(() => {
    if (hydrationQueue) {
      hydrate(client, { queries: hydrationQueue }, optionsRef.current)
    }
  }, [client, hydrationQueue])

  return <Fragment>{children}</Fragment>
}
