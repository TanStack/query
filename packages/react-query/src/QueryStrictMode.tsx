'use client'
import * as React from 'react'

import { useQueryClient } from './QueryClientProvider'
import { useIsRestoring } from './IsRestoringProvider'
import type {
  Query,
  QueryClient,
  QueryObserverResult,
} from '@tanstack/query-core'

/**
 * A problem reported by `QueryStrictMode`.
 */
export interface QueryStrictModeEvent {
  /**
   * `'missing-prefetch'` when a hook starts the initial fetch of its query, and `'unused-prefetch'`
   * when nothing used a prefetched query within `unusedPrefetchTimeout`.
   */
  type: 'missing-prefetch' | 'unused-prefetch'
  /**
   * For a `'missing-prefetch'`, whether the hook suspends on the fetch. A suspending hook can't
   * render until the fetch finishes, which causes request waterfalls. Use it to only report suspense
   * hooks, for example.
   */
  suspense?: boolean
  /**
   * A readable description of the problem.
   */
  message: string
  /**
   * The query the problem was found for.
   */
  query: Query<any, any, any, any>
}

/**
 * An error for a problem found by `QueryStrictMode`, for a `handler` to throw:
 *
 * - `'missing-prefetch'`: thrown by the hook, instead of starting the fetch.
 * - `'unused-prefetch'`: thrown by the outermost `QueryStrictMode`, to the error boundary above
 * it.
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallbackRender={({ error }) =>
 *     error instanceof QueryStrictModeError ? (
 *       <pre>{error.query.queryHash} was not prefetched</pre>
 *     ) : (
 *       <GenericError />
 *     )
 *   }
 * >
 *   <QueryStrictMode
 *     handler={(event) => {
 *       throw new QueryStrictModeError(event)
 *     }}
 *   >
 *     <Routes />
 *   </QueryStrictMode>
 * </ErrorBoundary>
 * ```
 */
export class QueryStrictModeError extends Error {
  /**
   * The type of the problem.
   */
  type: QueryStrictModeEvent['type']
  /**
   * The query the problem was found for.
   */
  query: Query<any, any, any, any>
  /**
   * Creates the error for a problem found by `QueryStrictMode`.
   * @param event - The problem to throw.
   */
  constructor(event: QueryStrictModeEvent) {
    super(event.message)
    this.name = 'QueryStrictModeError'
    this.type = event.type
    this.query = event.query
  }
}

/**
 * Called for every problem `QueryStrictMode` finds. Return to report the problem, or throw to send
 * it to an error boundary.
 * @param event - The problem that was found.
 */
export type QueryStrictModeHandler = (event: QueryStrictModeEvent) => void

/**
 * The props accepted by `QueryStrictMode`.
 */
export interface QueryStrictModeProps {
  /**
   * The subtree to check.
   */
  children?: React.ReactNode
  /**
   * Called for every problem that is found. Return to report it, or throw to send it to an error
   * boundary:
   *
   * - `'missing-prefetch'`: called during the render of the hook that reads the query. A throw goes
   * to the nearest error boundary above the hook, before the hook starts its fetch, so the query
   * stays idle and the handler is called again after the error boundary is reset. If the handler
   * returns, it isn't called again for the same query state.
   * - `'unused-prefetch'`: called by the outermost `QueryStrictMode`. A throw goes to the error
   * boundary above that `QueryStrictMode`, which unmounts the whole subtree. The handler of a
   * nested `QueryStrictMode` never receives it.
   *
   * Use it to filter out known or intentional waterfalls, for example by `queryKey`, `meta`, or
   * `suspense`.
   * @defaultValue Logs `event.message` with `console.error`.
   */
  handler?: QueryStrictModeHandler
  /**
   * How long a prefetched query may go unused, in milliseconds, before it is reported. The timer
   * starts when the data arrives in the cache.
   * @defaultValue 5000
   */
  unusedPrefetchTimeout?: number
  /**
   * Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will be
   * used.
   */
  queryClient?: QueryClient
}

/**
 * The value a `QueryStrictMode` shares with the hooks below it.
 */
export interface QueryStrictModeValue {
  /**
   * Called for the problems found by hooks below this `QueryStrictMode`.
   */
  handler: QueryStrictModeHandler
  /**
   * Marks a query read by a hook inside a `QueryStrictMode` as used. It counts as used even before
   * the reading component commits, for example while a sibling is still suspended.
   * @param query - The query the hook reads.
   */
  markUsed: (query: Query<any, any, any, any>) => void
}

const QueryStrictModeContext = React.createContext<QueryStrictModeValue | null>(
  null,
)

/**
 * Reads the nearest `QueryStrictMode`.
 * @returns The value of the nearest `QueryStrictMode`, or `null` outside of one.
 */
export const useQueryStrictMode = () => React.useContext(QueryStrictModeContext)

const defaultHandler: QueryStrictModeHandler = (event) => {
  console.error(event.message)
}

/**
 * Warns about prefetching problems during development:
 *
 * - `'missing-prefetch'`: a query hook, like `useQuery` or `useSuspenseQuery`, starts the initial
 * fetch of its query because it wasn't prefetched. Suspense hooks start it during render, which
 * causes request waterfalls; `event.suspense` tells them apart. Only reported for hooks inside
 * `QueryStrictMode`.
 * - `'unused-prefetch'`: a query was prefetched, but nothing used it within
 * `unusedPrefetchTimeout`. A query counts as used once a hook inside a `QueryStrictMode` reads it,
 * or while anything observes it. A query only read outside of `QueryStrictMode`, by a component
 * that unmounted before the timeout, is reported. Checked for the whole cache of the
 * `QueryClient`, except for queries that were already fetched before `QueryStrictMode` mounted.
 *
 * Data from `setQueryData` and `hydrate` doesn't count as a prefetch. A nested `QueryStrictMode`
 * reports missing prefetches in its subtree to its own `handler`, and leaves unused prefetches to
 * the outermost one. In production, it only renders `children`.
 *
 * Throw from `handler`, for example a `QueryStrictModeError`, to send a problem to an error
 * boundary instead of logging it.
 * @param props - The `children` to check, and optionally a `handler`, an `unusedPrefetchTimeout`,
 * and a `queryClient`.
 * @returns The `children`.
 * @example
 * ```tsx
 * import { QueryStrictMode } from '@tanstack/react-query'
 *
 * function App() {
 *   return (
 *     <QueryStrictMode
 *       handler={(event) => {
 *         if (!event.query.meta?.allowWaterfall) console.warn(event.message)
 *       }}
 *     >
 *       <Routes />
 *     </QueryStrictMode>
 *   )
 * }
 * ```
 */
export const QueryStrictMode = (props: QueryStrictModeProps) => {
  if (process.env.NODE_ENV === 'production') {
    return props.children
  }
  return <DevQueryStrictMode {...props} />
}

const DevQueryStrictMode = ({
  children,
  handler = defaultHandler,
  unusedPrefetchTimeout = 5000,
  queryClient,
}: QueryStrictModeProps) => {
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()
  const parent = useQueryStrictMode()
  const isNested = parent !== null

  const [{ used, markUsed: ownMarkUsed }] = React.useState(() => {
    const queries = new WeakSet<Query<any, any, any, any>>()
    return {
      used: queries,
      markUsed: (query: Query<any, any, any, any>) => {
        queries.add(query)
      },
    }
  })
  // A nested `QueryStrictMode` marks queries in the tracking of its ancestor, so unused prefetches
  // are only reported once
  const markUsed = isNested ? parent.markUsed : ownMarkUsed

  // Thrown during render, so it reaches the error boundary above this `QueryStrictMode`
  // Wrapped, so that any value thrown by `handler` is rethrown unchanged
  const [thrown, setThrown] = React.useState<{ error: unknown } | null>(null)
  if (thrown) {
    throw thrown.error
  }

  const handlerRef = React.useRef(handler)
  React.useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  React.useEffect(() => {
    if (isNested || isRestoring) {
      return
    }

    const timers = new Map<
      Query<any, any, any, any>,
      ReturnType<typeof setTimeout>
    >()

    const clearTimer = (query: Query<any, any, any, any>) => {
      clearTimeout(timers.get(query))
      timers.delete(query)
    }

    const isUnused = (query: Query<any, any, any, any>) =>
      !used.has(query) && query.getObserversCount() === 0

    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (event.type === 'removed') {
        clearTimer(event.query)
      } else if (
        event.type === 'updated' &&
        event.action.type === 'success' &&
        !event.action.manual &&
        !timers.has(event.query) &&
        isUnused(event.query)
      ) {
        const query = event.query
        const timer = setTimeout(() => {
          timers.delete(query)
          if (isUnused(query)) {
            // Report each query only once
            used.add(query)
            const problem: QueryStrictModeEvent = {
              type: 'unused-prefetch',
              message: `[${query.queryHash}]: The query was prefetched, but nothing used it within ${unusedPrefetchTimeout}ms. Remove the prefetch, or check that it uses the same queryKey as the query that reads it.`,
              query,
            }
            try {
              handlerRef.current(problem)
            } catch (error) {
              setThrown({ error })
            }
          }
        }, unusedPrefetchTimeout)
        timers.set(query, timer)
      }
    })

    return () => {
      unsubscribe()
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [client, used, isNested, isRestoring, unusedPrefetchTimeout])

  const value = React.useMemo(
    () => ({ handler, markUsed }),
    [handler, markUsed],
  )

  return (
    <QueryStrictModeContext.Provider value={value}>
      {children}
    </QueryStrictModeContext.Provider>
  )
}

// The query states a `'missing-prefetch'` was reported for. A component can render more than once
// before it starts the fetch, for example in `React.StrictMode`, but each state is only reported
// once
const reportedMissingPrefetches = new WeakSet<
  Query<any, any, any, any>['state']
>()

/**
 * Inside a `QueryStrictMode`, marks a query read by a hook as used, and reports a
 * `'missing-prefetch'` if the hook is about to start the initial fetch of the query. Does nothing
 * in production.
 * @param strictMode - The value of the nearest `QueryStrictMode`, if any.
 * @param query - The query the hook reads.
 * @param result - The optimistic result of the hook.
 * @param suspense - Whether the hook suspends while the query is pending.
 * @throws {unknown} Whatever the `handler` throws for the `'missing-prefetch'`.
 */
export const checkQueryStrictMode = (
  strictMode: QueryStrictModeValue | null,
  query: Query<any, any, any, any> | undefined,
  result: QueryObserverResult<any, any>,
  suspense: boolean,
) => {
  if (process.env.NODE_ENV !== 'production') {
    if (!strictMode || !query) {
      return
    }
    strictMode.markUsed(query)
    // A suspending hook starts the fetch during render. Otherwise, the optimistic result reports
    // `'fetching'` when the hook starts the fetch on mount, or after its options change.
    const startsInitialFetch = suspense
      ? result.isPending
      : result.fetchStatus === 'fetching' && query.state.data === undefined
    // Check the query's own state: the fetch hasn't started yet if it's still `'idle'`. A query
    // that errored is refetched after an error boundary reset, which isn't a missing prefetch.
    if (
      startsInitialFetch &&
      query.state.fetchStatus === 'idle' &&
      query.state.status !== 'error'
    ) {
      const event: QueryStrictModeEvent = {
        type: 'missing-prefetch',
        suspense,
        message: suspense
          ? `[${query.queryHash}]: A suspense query started its fetch during render. Prefetch it higher up (in a route loader, with usePrefetchQuery, or on the server) to avoid request waterfalls.`
          : `[${query.queryHash}]: A query started its fetch after rendering. Prefetch it higher up (in a route loader, with usePrefetchQuery, or on the server) to start the fetch earlier.`,
        query,
      }
      if (!reportedMissingPrefetches.has(query.state)) {
        // A throw from `handler` happens before the hook starts its fetch. The state is only marked
        // once `handler` returns, so the query stays idle and throws again after an error boundary
        // reset.
        strictMode.handler(event)
        reportedMissingPrefetches.add(query.state)
      }
    }
  }
}
