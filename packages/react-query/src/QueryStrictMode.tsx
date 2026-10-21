'use client'
import * as React from 'react'

import { environmentManager } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import { useIsRestoring } from './IsRestoringProvider'
import type {
  Query,
  QueryCache,
  QueryClient,
  QueryObserverResult,
} from '@tanstack/query-core'

/**
 * Reported when a query hook, like `useQuery` or `useSuspenseQuery`, starts the initial fetch of
 * its query because it wasn't prefetched. Suspense hooks start it during render, which causes
 * request waterfalls; `suspense` tells them apart. Only reported for hooks inside
 * `QueryStrictMode`.
 *
 * Data from `setQueryData` and `hydrate` doesn't count as a prefetch.
 */
export interface QueryStrictModeMissingPrefetchEvent {
  /**
   * Always `'missing-prefetch'`. Tells it apart from a {@link QueryStrictModeUnusedPrefetchEvent}.
   */
  type: 'missing-prefetch'
  /**
   * Whether the hook that started the fetch suspends, like `useSuspenseQuery`.
   */
  suspense: boolean
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
 * Reported when a query was prefetched, but nothing used it within `unusedPrefetchTimeout`. A
 * query counts as used once a hook inside a `QueryStrictMode` reads it, or while anything observes
 * it. A query only read outside of `QueryStrictMode`, by a component that unmounted before the
 * timeout, is reported. Checked for the whole cache of the `QueryClient`, except for queries that
 * were already fetched before `QueryStrictMode` mounted.
 *
 * Data from `setQueryData` and `hydrate` doesn't count as a prefetch.
 */
export interface QueryStrictModeUnusedPrefetchEvent {
  /**
   * Always `'unused-prefetch'`. Tells it apart from a {@link QueryStrictModeMissingPrefetchEvent}.
   */
  type: 'unused-prefetch'
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
 * A problem reported by `QueryStrictMode`: a {@link QueryStrictModeMissingPrefetchEvent} or a
 * {@link QueryStrictModeUnusedPrefetchEvent}. Narrow it by `type`.
 */
export type QueryStrictModeEvent =
  | QueryStrictModeMissingPrefetchEvent
  | QueryStrictModeUnusedPrefetchEvent

/**
 * Called when a hook inside `QueryStrictMode` starts the initial fetch of a query that wasn't
 * prefetched. Throw to send the problem to an error boundary, or return to let rendering continue,
 * for example after logging `event.message`. Thrown values are rethrown unchanged, so you can throw
 * a {@link QueryStrictModeMissingPrefetchError} or your own error.
 *
 * It is called during the render of the hook that reads the query, using the
 * `handleMissingPrefetch` of the nearest `QueryStrictMode`. A throw goes to the nearest error
 * boundary above the hook, before the hook starts its fetch. The query stays idle, so it is called
 * again after the error boundary is reset. If it returns, it isn't called again for the same query
 * state.
 *
 * Use it to filter out known or intentional waterfalls, for example by `queryKey`, `meta`, or
 * `suspense`.
 * @param event - The problem that was found.
 * @throws {unknown} Anything, to send the problem to an error boundary.
 * @example
 * ```tsx
 * <QueryStrictMode
 *   handleMissingPrefetch={(event) => {
 *     if (event.query.meta?.allowWaterfall) return
 *     throw new QueryStrictModeMissingPrefetchError(event)
 *   }}
 * >
 *   <Routes />
 * </QueryStrictMode>
 * ```
 */
export type QueryStrictModeMissingPrefetchHandler = (
  event: QueryStrictModeMissingPrefetchEvent,
) => void

/**
 * Called when a prefetched query isn't used within `unusedPrefetchTimeout`. Throw to send the
 * problem to an error boundary, or return, for example after logging `event.message`. Thrown values
 * are rethrown unchanged, so you can throw a {@link QueryStrictModeUnusedPrefetchError} or your own
 * error.
 *
 * Only the `handleUnusedPrefetch` of the outermost `QueryStrictMode` is called. A throw goes to the
 * error boundary above that `QueryStrictMode`, which unmounts the whole subtree.
 * @param event - The problem that was found.
 * @throws {unknown} Anything, to send the problem to an error boundary.
 * @example
 * ```tsx
 * <QueryStrictMode
 *   handleUnusedPrefetch={(event) => {
 *     throw new QueryStrictModeUnusedPrefetchError(event)
 *   }}
 * >
 *   <Routes />
 * </QueryStrictMode>
 * ```
 */
export type QueryStrictModeUnusedPrefetchHandler = (
  event: QueryStrictModeUnusedPrefetchEvent,
) => void

/**
 * The props accepted by `QueryStrictMode`.
 */
export interface QueryStrictModeProps {
  /**
   * The subtree to check.
   */
  children?: React.ReactNode
  /**
   * Called when a hook starts the initial fetch of a query that wasn't prefetched. See
   * {@link QueryStrictModeMissingPrefetchHandler} for where a throw goes.
   * @defaultValue A handler that throws a `QueryStrictModeMissingPrefetchError`.
   */
  handleMissingPrefetch?: QueryStrictModeMissingPrefetchHandler
  /**
   * Called when a prefetched query isn't used within `unusedPrefetchTimeout`. See
   * {@link QueryStrictModeUnusedPrefetchHandler} for where a throw goes. Ignored on a nested
   * `QueryStrictMode`.
   * @defaultValue A handler that logs `event.message` with `console.warn`.
   */
  handleUnusedPrefetch?: QueryStrictModeUnusedPrefetchHandler
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
   * Called for the missing prefetches found by hooks below this `QueryStrictMode`.
   */
  handleMissingPrefetch: QueryStrictModeMissingPrefetchHandler
}

/**
 * The base class of the errors for the problems found by `QueryStrictMode`: a
 * {@link QueryStrictModeMissingPrefetchError} or a {@link QueryStrictModeUnusedPrefetchError}. Use
 * it to catch both in an error boundary.
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallbackRender={({ error }) =>
 *     error instanceof QueryStrictModeError ? (
 *       <pre>
 *         {error.event.type}: {error.event.query.queryHash}
 *       </pre>
 *     ) : (
 *       <GenericError />
 *     )
 *   }
 * >
 *   <QueryStrictMode>
 *     <Routes />
 *   </QueryStrictMode>
 * </ErrorBoundary>
 * ```
 */
export class QueryStrictModeError extends Error {
  /**
   * The problem the error was created for.
   */
  event: QueryStrictModeEvent
  /**
   * Creates the error for a problem found by `QueryStrictMode`. Passes down `event.message` as the
   * `Error.message`. Only called by the errors for each problem.
   * @param event - The problem the error is for.
   */
  protected constructor(event: QueryStrictModeEvent) {
    super(event.message)
    this.name = 'QueryStrictModeError'
    this.event = event
  }
}

/**
 * The error for a {@link QueryStrictModeMissingPrefetchEvent}. The default `handleMissingPrefetch`
 * throws it.
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallbackRender={({ error }) =>
 *     error instanceof QueryStrictModeMissingPrefetchError ? (
 *       <pre>Prefetch {error.event.query.queryHash} in the route loader</pre>
 *     ) : (
 *       <GenericError />
 *     )
 *   }
 * >
 *   <QueryStrictMode>
 *     <Routes />
 *   </QueryStrictMode>
 * </ErrorBoundary>
 * ```
 */
export class QueryStrictModeMissingPrefetchError extends QueryStrictModeError {
  /**
   * The missing prefetch the error was created for.
   */
  declare event: QueryStrictModeMissingPrefetchEvent
  /**
   * Creates the error for a missing prefetch.
   * @param event - The missing prefetch the error is for.
   */
  constructor(event: QueryStrictModeMissingPrefetchEvent) {
    super(event)
    this.name = 'QueryStrictModeMissingPrefetchError'
  }
}

/**
 * The error for a {@link QueryStrictModeUnusedPrefetchEvent}. The default `handleUnusedPrefetch`
 * only logs, so throw it from your own.
 * @example
 * ```tsx
 * <QueryStrictMode
 *   handleUnusedPrefetch={(event) => {
 *     throw new QueryStrictModeUnusedPrefetchError(event)
 *   }}
 * >
 *   <Routes />
 * </QueryStrictMode>
 * ```
 */
export class QueryStrictModeUnusedPrefetchError extends QueryStrictModeError {
  /**
   * The unused prefetch the error was created for.
   */
  declare event: QueryStrictModeUnusedPrefetchEvent
  /**
   * Creates the error for an unused prefetch.
   * @param event - The unused prefetch the error is for.
   */
  constructor(event: QueryStrictModeUnusedPrefetchEvent) {
    super(event)
    this.name = 'QueryStrictModeUnusedPrefetchError'
  }
}

// Only created outside production, so production builds don't ship the context.
const QueryStrictModeContext =
  process.env.NODE_ENV !== 'production'
    ? React.createContext<QueryStrictModeValue | null>(null)
    : null

/**
 * Reads the nearest `QueryStrictMode`.
 * @returns The value of the nearest `QueryStrictMode`, or `null` outside of one.
 */
export const useQueryStrictMode = () =>
  React.useContext(QueryStrictModeContext!)

// Missing prefetches cause request waterfalls, so they are thrown. Unused prefetches only waste a
// request, so they are logged.
const defaultHandleMissingPrefetch: QueryStrictModeMissingPrefetchHandler = (
  event,
) => {
  throw new QueryStrictModeMissingPrefetchError(event)
}

const defaultHandleUnusedPrefetch: QueryStrictModeUnusedPrefetchHandler = (
  event,
) => {
  console.warn(event.message)
}

/**
 * Records when the data of each prefetch arrives in a `QueryCache`, starting from the first render
 * of an outermost `QueryStrictMode`. Data can arrive before `QueryStrictMode` commits, for example
 * while a sibling suspends, so the tracking can't wait for an effect.
 */
interface PrefetchTracker {
  /**
   * When the data of the last prefetch of each query arrived. Data from `setQueryData` and
   * `hydrate` isn't recorded.
   */
  prefetches: Map<Query<any, any, any, any>, number>
  /**
   * The queries read by a hook inside a `QueryStrictMode`, or already reported. A query counts as
   * used even before the reading component commits, for example while a sibling still suspends.
   * Shared by all `QueryStrictMode`s of the cache, so each unused prefetch is reported only once.
   */
  used: WeakSet<Query<any, any, any, any>>
  /**
   * When the prefetch was recorded that each query was last checked for, so a timer that already
   * ran doesn't start again
   */
  checked: WeakMap<Query<any, any, any, any>, number>
  /**
   * Called with a query when its prefetch is recorded, or when it is removed from the cache.
   */
  listeners: Set<(query: Query<any, any, any, any>) => void>
  /**
   * How many committed `QueryStrictMode`s use the tracker.
   */
  mounted: number
  unsubscribe: () => void
}

const prefetchTrackers = new WeakMap<QueryCache, PrefetchTracker>()

/**
 * Gets the tracker of a `QueryCache`, and starts tracking if no `QueryStrictMode` uses it yet.
 * @param cache - The cache to track.
 * @returns The tracker of `cache`.
 */
const getPrefetchTracker = (cache: QueryCache) => {
  let tracker = prefetchTrackers.get(cache)
  if (!tracker) {
    const prefetches: PrefetchTracker['prefetches'] = new Map()
    const listeners: PrefetchTracker['listeners'] = new Set()
    const unsubscribe = cache.subscribe((event) => {
      if (event.type === 'removed') {
        prefetches.delete(event.query)
      } else if (
        event.type === 'updated' &&
        event.action.type === 'success' &&
        !event.action.manual
      ) {
        prefetches.set(event.query, Date.now())
      } else {
        return
      }
      listeners.forEach((listener) => listener(event.query))
    })
    tracker = {
      prefetches,
      used: new WeakSet(),
      checked: new WeakMap(),
      listeners,
      mounted: 0,
      unsubscribe,
    }
    prefetchTrackers.set(cache, tracker)
  }
  return tracker
}
/**
 * The development implementation of `QueryStrictMode`. Tracks prefetches for the whole cache, and
 * shares `handleMissingPrefetch` with the hooks below it.
 * @param props - The `children` to check, and the handlers and options passed to `QueryStrictMode`.
 * @returns The `children`, inside the context of this `QueryStrictMode`.
 * @throws {unknown} Whatever `handleUnusedPrefetch` throws, during the next render.
 */
const DevQueryStrictMode = ({
  children,
  handleMissingPrefetch = defaultHandleMissingPrefetch,
  handleUnusedPrefetch = defaultHandleUnusedPrefetch,
  unusedPrefetchTimeout = 5000,
  queryClient,
}: QueryStrictModeProps) => {
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()
  const parent = useQueryStrictMode()
  const isNested = parent !== null

  // Thrown during render, so it reaches the error boundary above this `QueryStrictMode`. Wrapped,
  // so that any value thrown by `handleUnusedPrefetch` is rethrown unchanged
  const [thrown, setThrown] = React.useState<{ error: unknown } | null>(null)
  if (thrown) {
    throw thrown.error
  }

  // Tracked from the first render, so prefetches whose data arrives before the effect runs are
  // reported too. Not on the server, where nothing reports them.
  const cache = client.getQueryCache()
  if (!isNested && !environmentManager.isServer()) {
    getPrefetchTracker(cache)
  }

  const handleUnusedPrefetchRef = React.useRef(handleUnusedPrefetch)
  React.useEffect(() => {
    handleUnusedPrefetchRef.current = handleUnusedPrefetch
  }, [handleUnusedPrefetch])

  React.useEffect(() => {
    if (isNested || isRestoring) {
      return
    }

    const tracker = getPrefetchTracker(cache)
    const { used, checked } = tracker
    const timers = new Map<
      Query<any, any, any, any>,
      ReturnType<typeof setTimeout>
    >()

    const isUnused = (query: Query<any, any, any, any>) =>
      !used.has(query) && query.getObserversCount() === 0

    // Starts a timer from when the prefetch of `query` was recorded, or clears it when `query` was
    // removed from the cache
    const check = (query: Query<any, any, any, any>) => {
      const prefetchedAt = tracker.prefetches.get(query)
      if (prefetchedAt === undefined) {
        clearTimeout(timers.get(query))
        timers.delete(query)
        return
      }
      if (
        timers.has(query) ||
        checked.get(query) === prefetchedAt ||
        !isUnused(query)
      ) {
        return
      }
      const timer = setTimeout(
        () => {
          timers.delete(query)
          checked.set(query, prefetchedAt)
          if (isUnused(query)) {
            // Report each query only once
            used.add(query)
            const problem: QueryStrictModeUnusedPrefetchEvent = {
              type: 'unused-prefetch',
              message: `[${query.queryHash}]: The query was prefetched, but nothing used it within ${unusedPrefetchTimeout}ms. Remove the prefetch, or check that it uses the same queryKey as the query that reads it.`,
              query,
            }
            try {
              handleUnusedPrefetchRef.current(problem)
            } catch (error) {
              setThrown({ error })
            }
          }
        },
        Math.max(0, prefetchedAt + unusedPrefetchTimeout - Date.now()),
      )
      timers.set(query, timer)
    }

    tracker.mounted++
    tracker.listeners.add(check)
    tracker.prefetches.forEach((_, query) => check(query))

    return () => {
      tracker.listeners.delete(check)
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
      tracker.mounted--
      // Stop tracking once no `QueryStrictMode` uses the tracker. Checked in a microtask, because
      // `React.StrictMode` runs the effect again right after this cleanup.
      queueMicrotask(() => {
        if (tracker.mounted === 0 && prefetchTrackers.get(cache) === tracker) {
          tracker.unsubscribe()
          prefetchTrackers.delete(cache)
        }
      })
    }
  }, [cache, isNested, isRestoring, unusedPrefetchTimeout])

  const value = React.useMemo(
    () => ({ handleMissingPrefetch }),
    [handleMissingPrefetch],
  )
  const Provider = QueryStrictModeContext!.Provider

  return <Provider value={value}>{children}</Provider>
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
 * @param cache - The cache of the hook's `QueryClient`.
 * @param queryHash - The hash of the query the hook reads.
 * @param result - The optimistic result of the hook.
 * @param suspense - Whether the hook suspends while the query is pending.
 * @throws {unknown} Whatever `handleMissingPrefetch` throws.
 */
export const checkQueryStrictMode = (
  strictMode: QueryStrictModeValue | null,
  cache: QueryCache,
  queryHash: string,
  result: QueryObserverResult<any, any>,
  suspense: boolean,
) => {
  const query = strictMode && cache.get(queryHash)
  if (!query) {
    return
  }
  prefetchTrackers.get(cache)?.used.add(query)
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
    const event: QueryStrictModeMissingPrefetchEvent = {
      type: 'missing-prefetch',
      suspense,
      message: suspense
        ? `[${query.queryHash}]: A suspense query started its fetch during render. Prefetch it higher up (in a route loader, with usePrefetchQuery, or on the server) to avoid request waterfalls.`
        : `[${query.queryHash}]: A query started its fetch after rendering. Prefetch it higher up (in a route loader, with usePrefetchQuery, or on the server) to start the fetch earlier.`,
      query,
    }
    if (!reportedMissingPrefetches.has(query.state)) {
      // A throw from `handleMissingPrefetch` happens before the hook starts its fetch. The state
      // is only marked once it returns, so the query stays idle and throws again after an error
      // boundary reset.
      strictMode.handleMissingPrefetch(event)
      reportedMissingPrefetches.add(query.state)
    }
  }
}

/**
 * Reports prefetching problems in development: hooks that start the initial fetch of a query that
 * wasn't prefetched, and prefetched queries that nothing uses. See
 * {@link QueryStrictModeMissingPrefetchEvent} and {@link QueryStrictModeUnusedPrefetchEvent} for
 * what each problem means.
 *
 * By default, a missing prefetch throws a {@link QueryStrictModeMissingPrefetchError} to an error
 * boundary, and an unused prefetch is logged with `console.warn`. Pass `handleMissingPrefetch` or
 * `handleUnusedPrefetch` to filter problems, or to log or throw them instead. In production, it
 * only renders `children`.
 * @param props - The `children` to check, and optionally `handleMissingPrefetch`,
 * `handleUnusedPrefetch`, an `unusedPrefetchTimeout`, and a `queryClient`.
 * @returns The `children`.
 * @example
 * ```tsx
 * import { QueryStrictMode } from '@tanstack/react-query'
 *
 * function App() {
 *   return (
 *     <QueryStrictMode
 *       handleMissingPrefetch={(event) => {
 *         if (!event.query.meta?.allowWaterfall) console.warn(event.message)
 *       }}
 *     >
 *       <Routes />
 *     </QueryStrictMode>
 *   )
 * }
 * ```
 */
// A single expression, so that bundlers drop `DevQueryStrictMode` once `NODE_ENV` is replaced
export const QueryStrictMode = (props: QueryStrictModeProps) =>
  process.env.NODE_ENV === 'production' ? (
    props.children
  ) : (
    <DevQueryStrictMode {...props} />
  )
