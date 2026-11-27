import {
  isError,
  isFetchNextPageError,
  isFetchPreviousPageError,
  isFetched,
  isFetching,
  isFetchingNextPage,
  isFetchingPreviousPage,
  isLoading,
  isLoadingError,
  isPaused,
  isPending,
  isRefetchError,
  isRefetching,
  isSuccess,
} from '@tanstack/query-core-pluggable'
import type {
  InfiniteQueryObserverResult,
  QueryObserverResult,
} from '@tanstack/query-core-pluggable'

/** The narrowed result type guaranteed by a public query predicate. */
export type Guarded<TGuard> = TGuard extends ((
  result: any,
) => result is infer T)
  ? T
  : never

// Materialize intersections before comparing property modifiers. This preserves
// readonly properties, which the original writable-branch assertions detect.
type Properties<T> = { [K in keyof T]: T[K] }
/** The individual properties of a result narrowed by the public predicate. */
export type GuardedProperties<TGuard> = Properties<Guarded<TGuard>>

// For the v6 tests that pin literal flag types, compare the known result
// variant with what the real predicate accepts when it returns true.
type Possible<T> = T extends { data: never } | { fetchDirection: never }
  ? never
  : T
/** Whether a result always, never, or sometimes satisfies a predicate. */
export type FlagFor<TResult, TGuard> = [TResult] extends [Guarded<TGuard>]
  ? true
  : [Possible<Guarded<TGuard>>] extends [never]
    ? false
    : boolean

/** Reads a legacy expected object through the public helpers when comparing snapshots. */
export function resultForComparison(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(resultForComparison)
  if (
    !value ||
    typeof value !== 'object' ||
    !('dataUpdateCount' in value) ||
    !('refetch' in value)
  )
    return value
  const result = value as QueryObserverResult | InfiniteQueryObserverResult
  const { dataUpdateCount: _dataUpdates, ...rest } = result
  const queryFlags = {
    isPending: isPending(result),
    isSuccess: isSuccess(result),
    isError: isError(result),
    isFetching: isFetching(result),
    isPaused: isPaused(result),
    isLoading: isLoading(result),
    isRefetching: isRefetching(result),
    isLoadingError: isLoadingError(result),
    isRefetchError: isRefetchError(result),
    isFetched: isFetched(result),
  }
  if ('fetchDirection' in result && 'fetchDirection' in rest) {
    const { fetchDirection: _direction, ...pages } = rest
    return {
      ...pages,
      ...queryFlags,
      isFetchingNextPage: isFetchingNextPage(result),
      isFetchingPreviousPage: isFetchingPreviousPage(result),
      isFetchNextPageError: isFetchNextPageError(result),
      isFetchPreviousPageError: isFetchPreviousPageError(result),
    }
  }
  return { ...rest, ...queryFlags }
}
