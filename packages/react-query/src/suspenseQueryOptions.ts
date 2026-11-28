import { QueryObserver } from '@tanstack/query-core'
import { prepareSuspenseOptions } from './suspenseQuery'
import type {
  DefaultError,
  OmitKeyof,
  QueryKey,
  QueryKeyWithDataTag,
} from '@tanstack/query-core'
import type { QueryMode } from './queryOptions'
import type { SuspenseControls, SuspenseQueryMode } from './suspenseQuery'
import type {
  AnyUseQueryOptions,
  UseQueryOptions,
  UseSuspenseQueryOptions,
} from './types'

/** Options for a Suspense reader whose query function can be skipped. */
export type SkippableSuspenseQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
> = OmitKeyof<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'enabled' | 'throwOnError'
>

/**
 * Prepares a running query for a Suspense boundary.
 * @param options - The fetcher, its key and observer options. Suspense owns enabled and throwOnError.
 * @returns A descriptor for useQuery with a tagged cache key.
 */
export function suspenseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey> &
    SuspenseControls,
): UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> &
  QueryMode &
  SuspenseQueryMode<false>

/**
 * Prepares a query whose fetcher may be skipToken. Skipping lets the component render with cached or undefined data.
 * @param options - The fetcher, its key and observer options. Suspense owns enabled and throwOnError.
 * @returns A descriptor for useQuery with a tagged cache key.
 */
export function suspenseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: SkippableSuspenseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  > &
    SuspenseControls,
): SkippableSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> &
  QueryMode &
  SuspenseQueryMode<true>
export function suspenseQueryOptions(options: AnyUseQueryOptions) {
  return prepareSuspenseOptions(options, QueryObserver)
}
