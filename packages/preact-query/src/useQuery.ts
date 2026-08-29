import { QueryObserver } from '@tanstack/query-core'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'

import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'
import type {
  DefinedUseQueryResult,
  UseQueryOptions,
  UseQueryResult,
} from './types'
import { useBaseQuery } from './useBaseQuery'

/**
 * This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.
 *
 * @see {@link queryOptions} to share these options between `useQuery` and imperative APIs like `queryClient.query`.
 * @param options - The {@link DefinedInitialDataOptions} to use — everything you can pass to `useQuery`, with `initialData` set.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result, typed so that `status` is `success` — or `error` if a fetch attempt
 * fails while keeping the existing data (`status` never resolves to `pending` in this overload's type,
 * since `initialData` guarantees data upfront). `isSuccess`/`isError` are derived booleans for convenience.
 *
 * @example
 * ```tsx
 * import { useQuery } from '@tanstack/preact-query'
 *
 * function Posts() {
 *   // `data` is `Post[]`, never `undefined`, thanks to `initialData`.
 *   const { data } = useQuery({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *     initialData: [],
 *   })
 *
 *   return <>{data.map((post) => <p key={post.id}>{post.title}</p>)}</>
 * }
 * ```
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): DefinedUseQueryResult<TData, TError>

/**
 * @see {@link queryOptions} to share these options between `useQuery` and imperative APIs like `queryClient.query`.
 * @param options - The {@link UndefinedInitialDataOptions} to use — everything you can pass to `useQuery`.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result. `status` is `pending` if there is no cached data and no query attempt
 * has finished yet, `error` if the query attempt resulted in an error, or `success` if the query has data to
 * display. `isPending`/`isSuccess`/`isError` are derived booleans for convenience.
 *
 * @example
 * ```tsx
 * import { queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 * })
 *
 * function Posts() {
 *   const { status, data, error, isFetching } = useQuery(postsOptions)
 *
 *   if (status === 'pending') return 'Loading...'
 *   if (status === 'error') return <span>Error: {error.message}</span>
 *
 *   return (
 *     <div>
 *       {data.map((post) => (
 *         <p key={post.id}>{post.title}</p>
 *       ))}
 *       <div>{isFetching ? 'Background Updating...' : ' '}</div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * The same query, checking `isPending`/`isError` instead of `status` — pick whichever reads better to you:
 * ```tsx
 * import { useQuery } from '@tanstack/preact-query'
 *
 * function Posts() {
 *   const { isPending, isError, data, error } = useQuery({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *   })
 *
 *   if (isPending) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return <>{data.map((post) => <p key={post.id}>{post.title}</p>)}</>
 * }
 * ```
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError>

/**
 * @see {@link queryOptions} to share these options between `useQuery` and imperative APIs like `queryClient.query`.
 * @param options - The {@link UseQueryOptions} to use — everything you can pass to `useQuery`.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result. `status` is `pending` if there is no cached data and no query attempt
 * has finished yet, `error` if the query attempt resulted in an error, or `success` if the query has data to
 * display. `isPending`/`isSuccess`/`isError` are derived booleans for convenience.
 *
 * @example
 * ```tsx
 * import { queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 * })
 *
 * function Posts() {
 *   const { status, data, error, isFetching } = useQuery(postsOptions)
 *
 *   if (status === 'pending') return 'Loading...'
 *   if (status === 'error') return <span>Error: {error.message}</span>
 *
 *   return (
 *     <div>
 *       {data.map((post) => (
 *         <p key={post.id}>{post.title}</p>
 *       ))}
 *       <div>{isFetching ? 'Background Updating...' : ' '}</div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * A dependent query, only enabled once `postId` is set — use `isLoading`, not `isPending`, so the
 * loading state doesn't show while the query is disabled:
 * ```tsx
 * import { useQuery } from '@tanstack/preact-query'
 *
 * function Post({ postId }: { postId: number | undefined }) {
 *   const { data, isLoading, isError, error } = useQuery({
 *     queryKey: ['post', postId],
 *     queryFn: () => fetchPost(postId!),
 *     enabled: postId != null,
 *   })
 *
 *   if (postId == null) return 'Select a post'
 *   if (isLoading) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return <h1>{data?.title}</h1>
 * }
 * ```
 *
 * @example
 * Seeding a detail query from an already-cached list, to skip the loading state:
 * ```tsx
 * import { useQuery, useQueryClient } from '@tanstack/preact-query'
 *
 * function Post({ postId }: { postId: number }) {
 *   const queryClient = useQueryClient()
 *
 *   const { data } = useQuery({
 *     queryKey: ['post', postId],
 *     queryFn: () => fetchPost(postId),
 *     initialData: () =>
 *       queryClient
 *         .getQueryData<Array<Post>>(['posts'])
 *         ?.find((post) => post.id === postId),
 *   })
 *
 *   return <h1>{data?.title}</h1>
 * }
 * ```
 *
 * @example
 * Paginated data, keeping the previous page's data visible while the next page loads:
 * ```tsx
 * import { keepPreviousData, useQuery } from '@tanstack/preact-query'
 * import { useState } from 'preact/hooks'
 *
 * function Posts() {
 *   const [page, setPage] = useState(0)
 *
 *   const { data, isPlaceholderData } = useQuery({
 *     queryKey: ['posts', page],
 *     queryFn: () => fetchPosts(page),
 *     placeholderData: keepPreviousData,
 *   })
 *
 *   return (
 *     <div>
 *       {data?.map((post) => <p key={post.id}>{post.title}</p>)}
 *       <button
 *         disabled={isPlaceholderData}
 *         onClick={() => setPage((old) => old + 1)}
 *       >
 *         Next Page
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Warming the cache on hover, so `<Post>` has data as soon as it's clicked. Requires a
 * {@link queryOptions} factory, so the hook and the imperative call share the same cache entry:
 * ```tsx
 * import { noop, queryOptions, useQuery, useQueryClient } from '@tanstack/preact-query'
 *
 * const postOptions = (id: string) =>
 *   queryOptions({
 *     queryKey: ['post', id],
 *     queryFn: () => fetchPost(id),
 *   })
 *
 * function Post({ id }: { id: string }) {
 *   const { data } = useQuery(postOptions(id))
 *   return <h1>{data?.title}</h1>
 * }
 *
 * function PostLink({ id, title }: { id: string; title: string }) {
 *   const queryClient = useQueryClient()
 *
 *   return (
 *     <a
 *       href={`/posts/${id}`}
 *       onMouseEnter={() => queryClient.query(postOptions(id)).catch(noop)}
 *     >
 *       {title}
 *     </a>
 *   )
 * }
 * ```
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError>

export function useQuery(options: UseQueryOptions, queryClient?: QueryClient) {
  return useBaseQuery(options, QueryObserver, queryClient)
}
