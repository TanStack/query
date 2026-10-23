import type * as React from 'react'
import type { Query, QueryClient } from '@tanstack/query-core'
// Only used in `{@link}`s
import type {
  QueryStrictModeMissingPrefetchError,
  QueryStrictModeUnusedPrefetchError,
} from './QueryStrictModeError'

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
 * `handleMissingPrefetch` of the nearest `QueryStrictMode` that has one. A throw goes to the nearest error
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
   * {@link QueryStrictModeMissingPrefetchHandler} for where a throw goes. A nested
   * `QueryStrictMode` without one uses the one of its parent.
   * @defaultValue The `handleMissingPrefetch` of the parent `QueryStrictMode`, or a handler that
   * throws a `QueryStrictModeMissingPrefetchError` outside of one.
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
