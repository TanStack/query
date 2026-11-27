import { infiniteFetchOptions } from './infiniteQueryBehavior'
import { fetchQuery } from './queryClient'
import type { QueryClient, WithoutSkipToken } from './queryClient'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryExecuteOptions,
  QueryKey,
} from './types'

/**
 * Asynchronous method to fetch and cache an infinite query, resolving with an
 * {@link InfiniteData} object or throwing with the error.
 *
 * Requires `initialPageParam` and `getNextPageParam`. Use `pages` to specify how many
 * pages to fetch. If you omit `pages`, the client fetches up to the number of cached
 * pages, or one page if the cache has no pages.
 * If shared infinite query options contain `skipToken` as their `queryFn`, the call skips fetching
 * and resolves with existing data or `undefined` on a cache miss. Use {@link getQueryData}
 * to read the cache directly.
 * @param client - The client that stores the query.
 * @param options - The query to fetch and the options that control which pages to fetch.
 * @returns A promise that resolves to the {@link InfiniteData}, or to the result of `select` if
 * provided. It rejects with the error from the fetch or from `select`.
 * @example
 * ```ts
 * try {
 *   const data = await fetchInfiniteQuery(queryClient, {
 *     queryKey,
 *     queryFn,
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   })
 *   console.log(data.pages)
 * } catch (error) {
 *   console.log(error)
 * }
 * ```
 */
export function fetchInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  client: QueryClient,
  options: WithoutSkipToken<
    InfiniteQueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
): Promise<
  Array<TData> extends Array<InfiniteData<TQueryFnData>>
    ? InfiniteData<TQueryFnData, TPageParam>
    : TData
>
export function fetchInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  client: QueryClient,
  options: InfiniteQueryExecuteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): Promise<
  | undefined
  | (Array<TData> extends Array<InfiniteData<TQueryFnData>>
      ? InfiniteData<TQueryFnData, TPageParam>
      : TData)
>
export function fetchInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  client: QueryClient,
  options: InfiniteQueryExecuteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): Promise<
  | undefined
  | (Array<TData> extends Array<InfiniteData<TQueryFnData>>
      ? InfiniteData<TQueryFnData, TPageParam>
      : TData)
> {
  return fetchQuery(client, infiniteFetchOptions(options) as any)
}
