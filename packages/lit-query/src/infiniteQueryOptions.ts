import type {
  DataTag,
  DefaultError,
  InfiniteData,
  InfiniteQueryMode,
  InfiniteQueryObserverOptions,
  QueryKey,
} from '@tanstack/query-core'

/**
 * Brands infinite query options so the `queryKey` carries the infinite query
 * data and error types across TanStack Query APIs.
 * @param options - Infinite query options to preserve and brand.
 * @returns The same options object with a typed `queryKey`.
 * @example
 * ```ts
 * import { infiniteQueryOptions } from '@tanstack/lit-query'
 *
 * const projectsOptions = infiniteQueryOptions({
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextCursor,
 * })
 * ```
 */
export function infiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    undefined
  >,
): InfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  undefined
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
}
export function infiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    InfiniteQueryMode
  >,
): InfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  InfiniteQueryMode
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
}

export function infiniteQueryOptions(options: unknown) {
  return options
}
