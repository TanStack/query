'use client'
// The development-only part of `QueryStrictMode`. Only imported behind `NODE_ENV` checks, so
// production bundles leave this file out.
import * as React from 'react'

import { environmentManager } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import { useIsRestoring } from './IsRestoringProvider'
import {
  QueryStrictModeProvider,
  useQueryStrictMode,
} from './QueryStrictModeContext'
import { QueryStrictModeMissingPrefetchError } from './QueryStrictModeError'
import type {
  Query,
  QueryCache,
  QueryObserverResult,
} from '@tanstack/query-core'
import type {
  QueryStrictModeMissingPrefetchEvent,
  QueryStrictModeMissingPrefetchHandler,
  QueryStrictModeProps,
  QueryStrictModeUnusedPrefetchEvent,
  QueryStrictModeUnusedPrefetchHandler,
  QueryStrictModeValue,
} from './QueryStrictModeTypes'

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
export const DevQueryStrictMode = ({
  children,
  handleUnusedPrefetch = defaultHandleUnusedPrefetch,
  unusedPrefetchTimeout = 5000,
  queryClient,
  ...props
}: QueryStrictModeProps) => {
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()
  const parent = useQueryStrictMode()
  const isNested = parent !== null
  // A nested `QueryStrictMode` without its own handler keeps the one of its parent
  const handleMissingPrefetch =
    props.handleMissingPrefetch ??
    parent?.handleMissingPrefetch ??
    defaultHandleMissingPrefetch

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
  return (
    <QueryStrictModeProvider value={value}>{children}</QueryStrictModeProvider>
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
