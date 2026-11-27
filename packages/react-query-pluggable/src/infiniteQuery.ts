import { InfiniteQueryObserver } from './runtime/infiniteQueryObserver'
import type { DefaultError, InfiniteData, QueryKey } from '@tanstack/query-core'
import type {
  DefinedInitialDataInfiniteOptions,
  UnusedSkipTokenInfiniteOptions,
} from './infiniteQueryOptions'
import type {
  AnyUseInfiniteQueryOptions,
  UseInfiniteQueryOptions,
} from './types'

/** Identifies options that read pages through an infinite query observer. */
export interface InfiniteQueryMode {
  /** The observer that adds pagination controls to the result. */
  readonly Observer: typeof InfiniteQueryObserver
}

/**
 * Configures a paginated query to read through `useQuery`.
 * @param options - The page fetcher, initial page parameter and pagination callbacks.
 * @returns The options with their matching observer.
 */
export function infiniteQuery<
  TQueryFnData,
  TPageParam = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  InfiniteQueryMode
export function infiniteQuery<
  TQueryFnData,
  TPageParam = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UnusedSkipTokenInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): UnusedSkipTokenInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  InfiniteQueryMode
export function infiniteQuery<
  TQueryFnData,
  TPageParam = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> &
  InfiniteQueryMode
export function infiniteQuery(options: AnyUseInfiniteQueryOptions) {
  return { ...options, Observer: InfiniteQueryObserver }
}
