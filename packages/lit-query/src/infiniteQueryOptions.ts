import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserverOptions,
  QueryKey,
} from '@tanstack/query-core'

/**
 * Preserves and types infinite query options for reuse across Lit Query APIs.
 *
 * @param options - Infinite query options to preserve.
 * @returns The same options object.
 *
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
    TPageParam
  >,
): InfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> {
  return options
}
