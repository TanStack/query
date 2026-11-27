'use client'

import { QueryObserver } from './runtime/queryObserver'
import { useBaseQuery } from './useBaseQuery'
import type {
  AnyDataTag,
  DefaultError,
  InfiniteData,
  QueryKey,
} from '@tanstack/query-core'
import type { InfiniteQueryMode } from './infiniteQuery'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'
import type { QueryClient } from './runtime/queryClient'
import type { suspenseQueryPolicy } from './suspense'
import type { SuspenseQueryOptions } from './suspenseQuery'
import type {
  AnyUseInfiniteQueryOptions,
  AnyUseQueryOptions,
  DefinedUseInfiniteQueryResult,
  DefinedUseQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseQueryOptions,
  UseQueryResult,
  UseSuspenseInfiniteQueryResult,
  UseSuspenseQueryResult,
} from './types'

type PreparedQuery =
  | (AnyUseQueryOptions & { queryKey: AnyDataTag; getNextPageParam?: never })
  | (AnyUseInfiniteQueryOptions & InfiniteQueryMode)

type HasInitialData<T, TQueryData> = T extends {
  initialData: TQueryData | (() => TQueryData)
}
  ? true
  : false

type PreparedQueryResult<T> = T extends InfiniteQueryMode &
  UseInfiniteQueryOptions<
    infer TPage,
    infer TError,
    infer TData,
    any,
    infer TPageParam
  >
  ? T extends { renderPolicy: typeof suspenseQueryPolicy }
    ? UseSuspenseInfiniteQueryResult<TData, TError>
    : HasInitialData<T, InfiniteData<TPage, TPageParam>> extends true
      ? DefinedUseInfiniteQueryResult<TData, TError>
      : UseInfiniteQueryResult<TData, TError>
  : T extends UseQueryOptions<
        infer TQueryFnData,
        infer TError,
        infer TData,
        any
      >
    ? T extends { renderPolicy: typeof suspenseQueryPolicy }
      ? UseSuspenseQueryResult<TData, TError>
      : HasInitialData<T, Exclude<TQueryFnData, undefined>> extends true
        ? DefinedUseQueryResult<TData, TError>
        : UseQueryResult<TData, TError>
    : never

/**
 * Reads prepared regular or paginated options, including a choice between them.
 * @param options - Query options prepared for the selected observer and render policy.
 * @param queryClient - The client to use. Defaults to the nearest provider.
 * @returns The result for the selected query, including pagination controls for infinite queries.
 */
export function useQuery<T extends PreparedQuery>(
  options: T,
  queryClient?: QueryClient,
): PreparedQueryResult<T>

/**
 * Reads a query using the render policy supplied by `suspenseQuery`.
 * @param options - Options returned by `suspenseQuery` for a running query.
 * @param queryClient - Defaults to the nearest provider's client.
 * @returns The result with defined data when the component can render.
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: SuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseSuspenseQueryResult<TData, TError>

/**
 * This overload is selected when `initialData` is known to be defined, so the resulting `data` is typed as never
 * `undefined` (unless a `select` changes `TData` to include `undefined`). At runtime, `data` is still `undefined`
 * if `select` throws on its first call.
 * @param options - The {@link DefinedInitialDataOptions} to use — everything you can pass to `useQuery`, with `initialData` known to be defined.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result, typed so that `status` is `success` or `error` (`status` never
 * resolves to `pending` in this overload's type, since `initialData` guarantees data upfront). `status` is
 * `error` if the query has an error from a fetch that failed after its retries or if `select` threw, and
 * `success` otherwise. `isSuccess`/`isError` are derived booleans for convenience.
 * @see {@link queryOptions} to share these options between `useQuery` and imperative APIs like `fetchQuery`.
 * @example
 * ```tsx
 * import { useQuery } from '@tanstack/react-query-pluggable'
 *
 * function Posts() {
 *   // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
 *   // so the list stays visible alongside the error.
 *   const { data, isError, error } = useQuery({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *     initialData: [],
 *   })
 *
 *   return (
 *     <div>
 *       {isError ? <span>Error: {error.message}</span> : null}
 *       <ul>
 *         {data.map((post) => <li key={post.id}>{post.title}</li>)}
 *       </ul>
 *     </div>
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
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): DefinedUseQueryResult<TData, TError>

/**
 * This overload is selected when `initialData` is omitted, may be `undefined`, or is a function that may
 * return `undefined`, so the resulting `data` can be `undefined`.
 * @param options - The {@link UndefinedInitialDataOptions} to use — everything you can pass to `useQuery`.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result. `status` is `error` if the query has an error from a fetch that failed
 * after its retries or if `select` threw, `success` if the query has cached data (even if `select` returns
 * `undefined`) or data from `placeholderData`, and `pending` otherwise. `isPending`/`isSuccess`/`isError`
 * are derived booleans for convenience.
 * @see {@link queryOptions} to share these options between `useQuery` and imperative APIs like `fetchQuery`.
 * @example
 * ```tsx
 * import { useQuery } from '@tanstack/react-query-pluggable'
 *
 * function Posts() {
 *   const { status, data, error, isFetching } = useQuery({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *   })
 *
 *   if (status === 'pending') return 'Loading...'
 *   if (status === 'error') return <span>Error: {error.message}</span>
 *
 *   return (
 *     <div>
 *       <ul>
 *         {data.map((post) => (
 *           <li key={post.id}>{post.title}</li>
 *         ))}
 *       </ul>
 *       <div>{isFetching ? 'Background Updating...' : ' '}</div>
 *     </div>
 *   )
 * }
 * ```
 * @example
 * The same query, checking `isPending`/`isError` instead of `status` — pick whichever reads better to you:
 * ```tsx
 * import { useQuery } from '@tanstack/react-query-pluggable'
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
 *   return (
 *     <ul>
 *       {data.map((post) => <li key={post.id}>{post.title}</li>)}
 *     </ul>
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
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError>

/**
 * Fallback overload for options whose `initialData` presence isn't statically known — for example, an
 * object typed as {@link UseQueryOptions} rather than an object literal. Prefer one of the other overloads
 * when possible, since they infer whether `data` can be `undefined` from `initialData` directly.
 * @param options - The {@link UseQueryOptions} to use — everything you can pass to `useQuery`.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result. `status` is `error` if the query has an error from a fetch that failed
 * after its retries or if `select` threw, `success` if the query has cached data (even if `select` returns
 * `undefined`) or data from `placeholderData`, and `pending` otherwise. `isPending`/`isSuccess`/`isError`
 * are derived booleans for convenience.
 * @see {@link queryOptions} to share these options between `useQuery` and imperative APIs like `fetchQuery`.
 * @example
 * ```tsx
 * import { useQuery } from '@tanstack/react-query-pluggable'
 *
 * function Posts() {
 *   const { status, data, error, isFetching } = useQuery({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *   })
 *
 *   if (status === 'pending') return 'Loading...'
 *   if (status === 'error') return <span>Error: {error.message}</span>
 *
 *   return (
 *     <div>
 *       <ul>
 *         {data.map((post) => (
 *           <li key={post.id}>{post.title}</li>
 *         ))}
 *       </ul>
 *       <div>{isFetching ? 'Background Updating...' : ' '}</div>
 *     </div>
 *   )
 * }
 * ```
 * @example
 * `select` derives whatever `data` a component needs from the cached value, without changing what's
 * actually stored in the cache — the cache still holds the full `Post[]`, but `data` here is a `number`:
 * ```tsx
 * import { select, useQuery } from '@tanstack/react-query-pluggable'
 *
 * function PostCount() {
 *   const { data, isPending, isError, error } = useQuery({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *     select: [select, (posts) => posts.length],
 *   })
 *
 *   if (isPending) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return <span>{data} posts</span>
 * }
 * ```
 * @example
 * A dependent query, only enabled once `postId` is set — use `isLoading`, not `isPending`, so the
 * loading state doesn't show while the query is disabled:
 * ```tsx
 * import { useQuery } from '@tanstack/react-query-pluggable'
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
 * @example
 * The same dependent query, type safe: `skipToken` disables the query without needing the
 * non-null assertion above, since `queryFn` is only ever called when `postId` is defined.
 * `refetch` doesn't work while `queryFn` is `skipToken` — use `enabled: false` instead if you
 * need to trigger the query manually:
 * ```tsx
 * import { skipToken, useQuery } from '@tanstack/react-query-pluggable'
 *
 * function Post({ postId }: { postId: number | undefined }) {
 *   const { data, isLoading, isError, error } = useQuery({
 *     queryKey: ['post', postId],
 *     queryFn: postId != null ? () => fetchPost(postId) : skipToken,
 *   })
 *
 *   if (postId == null) return 'Select a post'
 *   if (isLoading) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return <h1>{data?.title}</h1>
 * }
 * ```
 * @example
 * Seeding a detail query from an already-cached list, to skip the loading state. `initialDataUpdatedAt` carries
 * over the list's own fetch time, so that if you set a `staleTime`, it's measured from when the list was
 * fetched rather than from now:
 * ```tsx
 * import { useQuery, useQueryClient, getQueryData, getQueryState } from '@tanstack/react-query-pluggable'
 *
 * function Post({ postId }: { postId: number }) {
 *   const queryClient = useQueryClient()
 *
 *   const { data, isError, error } = useQuery({
 *     queryKey: ['post', postId],
 *     queryFn: () => fetchPost(postId),
 *     initialData: () =>
 *       getQueryData(queryClient, ['posts'])
 *         ?.find((post) => post.id === postId),
 *     initialDataUpdatedAt: () =>
 *       getQueryState(queryClient, ['posts'])?.dataUpdatedAt,
 *   })
 *
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return <h1>{data?.title}</h1>
 * }
 * ```
 * @example
 * Paginated data, keeping the previous page's data visible while the next page loads:
 * ```tsx
 * import { keepPreviousData, placeholderData, useQuery } from '@tanstack/react-query-pluggable'
 * import { useState } from 'react'
 *
 * function Posts() {
 *   const [page, setPage] = useState(0)
 *
 *   const { data, isPlaceholderData, isError, error } = useQuery({
 *     queryKey: ['posts', page],
 *     queryFn: () => fetchPosts(page),
 *     placeholderData: placeholderData(keepPreviousData),
 *   })
 *
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return (
 *     <div>
 *       <ul>
 *         {data?.map((post) => <li key={post.id}>{post.title}</li>)}
 *       </ul>
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

export function useQuery(
  options:
    | ((AnyUseQueryOptions | AnyUseInfiniteQueryOptions) & {
        Observer?: InfiniteQueryMode['Observer']
        renderPolicy?: typeof suspenseQueryPolicy
      })
    | null
    | undefined,
  queryClient?: QueryClient,
) {
  return useBaseQuery(
    options as AnyUseQueryOptions,
    (options?.Observer ?? QueryObserver) as typeof QueryObserver,
    queryClient,
    options?.renderPolicy,
  )
}
