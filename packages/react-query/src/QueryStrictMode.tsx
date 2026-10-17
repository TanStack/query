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
 * Thrown instead of logging a problem when `throwOnMissingPrefetch` or `throwOnUnusedPrefetch`
 * applies to it:
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
 *   <Routes />
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
 * Receives every problem `QueryStrictMode` finds.
 * @param event - The problem that was found.
 */
export type QueryStrictModeLogger = (event: QueryStrictModeEvent) => void

/**
 * Whether a problem is thrown instead of being passed to `logger`.
 * @param event - The problem that was found.
 * @returns `true` to throw the problem as a `QueryStrictModeError`.
 */
export type QueryStrictModeThrowOption =
  | boolean
  | ((event: QueryStrictModeEvent) => boolean)

/**
 * Checks whether a problem should be thrown.
 * @param option - The `throwOnMissingPrefetch` or `throwOnUnusedPrefetch` option.
 * @param event - The problem that was found.
 * @returns Whether to throw `event`.
 */
const shouldThrowQueryStrictModeEvent = (
  option: QueryStrictModeThrowOption,
  event: QueryStrictModeEvent,
) => (typeof option === 'function' ? option(event) : option)

/**
 * The props accepted by `QueryStrictMode`.
 */
export interface QueryStrictModeProps {
  /**
   * The subtree to check.
   */
  children?: React.ReactNode
  /**
   * Receives every problem that is found. Use it to filter out known or intentional waterfalls, for
   * example by `queryKey`, `meta`, or `suspense`.
   * @defaultValue Logs `event.message` with `console.error`.
   */
  logger?: QueryStrictModeLogger
  /**
   * How long a prefetched query may go unused, in milliseconds, before it is reported. The timer
   * starts when the data arrives in the cache.
   * @defaultValue 5000
   */
  unusedPrefetchTimeout?: number
  /**
   * Throw a `'missing-prefetch'` to the nearest error boundary as a `QueryStrictModeError`, instead
   * of passing it to `logger`.
   * The hook throws before it starts its fetch, so the subtree stays broken until the query is
   * prefetched. Pass a function to only throw for some queries; the others are still logged.
   * Applies to the hooks below this `QueryStrictMode`, and not below a nested one.
   * @defaultValue false
   */
  throwOnMissingPrefetch?: QueryStrictModeThrowOption
  /**
   * Throw an `'unused-prefetch'` as a `QueryStrictModeError` from this `QueryStrictMode` to the
   * error boundary above it, instead of passing it to `logger`. This unmounts the whole subtree.
   * Pass a function to only throw for some queries; the others are still logged. Ignored by a
   * nested `QueryStrictMode`, because only the outermost one checks for unused prefetches.
   * @defaultValue false
   */
  throwOnUnusedPrefetch?: QueryStrictModeThrowOption
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
   * Receives the problems found by hooks below this `QueryStrictMode`.
   */
  logger: QueryStrictModeLogger
  /**
   * Whether hooks below this `QueryStrictMode` throw a `'missing-prefetch'` instead of logging it.
   */
  throwOnMissingPrefetch: QueryStrictModeThrowOption
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

const defaultLogger: QueryStrictModeLogger = (event) => {
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
 * reports missing prefetches in its subtree to its own `logger`, and leaves unused prefetches to
 * the outermost one. In production, it only renders `children`.
 *
 * Set `throwOnMissingPrefetch` or `throwOnUnusedPrefetch` to throw a `QueryStrictModeError` to an
 * error boundary instead of logging.
 * @param props - The `children` to check, and optionally a `logger`, an `unusedPrefetchTimeout`,
 * a `throwOnMissingPrefetch`, a `throwOnUnusedPrefetch`, and a `queryClient`.
 * @returns The `children`.
 * @example
 * ```tsx
 * import { QueryStrictMode } from '@tanstack/react-query'
 *
 * function App() {
 *   return (
 *     <QueryStrictMode
 *       logger={(event) => {
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
  logger = defaultLogger,
  unusedPrefetchTimeout = 5000,
  throwOnMissingPrefetch = false,
  throwOnUnusedPrefetch = false,
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
  const [error, setError] = React.useState<QueryStrictModeError | null>(null)
  if (error) {
    throw error
  }

  const loggerRef = React.useRef(logger)
  const throwOnUnusedPrefetchRef = React.useRef(throwOnUnusedPrefetch)
  React.useEffect(() => {
    loggerRef.current = logger
    throwOnUnusedPrefetchRef.current = throwOnUnusedPrefetch
  }, [logger, throwOnUnusedPrefetch])

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
            if (
              shouldThrowQueryStrictModeEvent(
                throwOnUnusedPrefetchRef.current,
                problem,
              )
            ) {
              setError(new QueryStrictModeError(problem))
            } else {
              loggerRef.current(problem)
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
    () => ({ logger, throwOnMissingPrefetch, markUsed }),
    [logger, throwOnMissingPrefetch, markUsed],
  )

  return (
    <QueryStrictModeContext.Provider value={value}>
      {children}
    </QueryStrictModeContext.Provider>
  )
}

// The query states a `'missing-prefetch'` was logged for. A component can render more than once
// before it starts the fetch, for example in `React.StrictMode`, but each state is only logged once
const loggedMissingPrefetches = new WeakSet<
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
 * @throws {QueryStrictModeError} When `throwOnMissingPrefetch` applies to the `'missing-prefetch'`.
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
      // Throw before the hook starts its fetch, so the query stays idle and throws again after
      // an error boundary reset
      if (
        shouldThrowQueryStrictModeEvent(
          strictMode.throwOnMissingPrefetch,
          event,
        )
      ) {
        throw new QueryStrictModeError(event)
      }
      if (!loggedMissingPrefetches.has(query.state)) {
        loggedMissingPrefetches.add(query.state)
        strictMode.logger(event)
      }
    }
  }
}
