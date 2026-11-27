import { InfiniteQueryObserver } from '@tanstack/query-core-pluggable'
import { prepareSuspenseOptions } from './suspenseQuery'
import type {
  DefaultError,
  InfiniteData,
  OmitKeyof,
  QueryKey,
  QueryKeyWithDataTag,
} from '@tanstack/query-core-pluggable'
import type {
  InfiniteQueryMode,
  ResolvedPages,
  UnselectedPages,
} from './infiniteQueryOptions'
import type { SuspenseControls, SuspenseQueryMode } from './suspenseQuery'
import type {
  AnyUseInfiniteQueryOptions,
  UseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryOptions,
} from './types'

/** The infinite query options accepted when the fetcher may be disabled with skipToken. */
export type SkippableSuspenseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> = OmitKeyof<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'enabled' | 'throwOnError'
>

/**
 * Prepares a running paginated query for a Suspense boundary.
 * @param options - The page fetcher, its key and observer options. Suspense owns enabled and throwOnError.
 * @returns A descriptor for useQuery with a tagged cache key and pagination controls.
 */
export function suspenseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = UnselectedPages,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseSuspenseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  > &
    SuspenseControls,
): UseSuspenseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  ResolvedPages<TData, TQueryFnData, TPageParam>,
  TQueryKey,
  TPageParam
> &
  QueryKeyWithDataTag<
    TQueryKey,
    InfiniteData<TQueryFnData, TPageParam>,
    TError
  > &
  InfiniteQueryMode &
  SuspenseQueryMode<false>

/**
 * Prepares a query whose fetcher may be skipToken. Skipping lets the component render with cached or undefined data.
 * @param options - The page fetcher, its key and observer options. Suspense owns enabled and throwOnError.
 * @returns A descriptor for useQuery with a tagged cache key and pagination controls.
 */
export function suspenseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = UnselectedPages,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: SkippableSuspenseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  > &
    SuspenseControls,
): SkippableSuspenseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  ResolvedPages<TData, TQueryFnData, TPageParam>,
  TQueryKey,
  TPageParam
> &
  QueryKeyWithDataTag<
    TQueryKey,
    InfiniteData<TQueryFnData, TPageParam>,
    TError
  > &
  InfiniteQueryMode &
  SuspenseQueryMode<true>
export function suspenseInfiniteQueryOptions(
  options: AnyUseInfiniteQueryOptions,
) {
  return prepareSuspenseOptions(options, InfiniteQueryObserver)
}
