import type {
  DefaultError,
  InfiniteData,
  InitialDataFunction,
  NonUndefinedGuard,
  OmitKeyof,
  QueryKey,
  QueryKeyWithDataTag,
  SkipToken,
} from '@tanstack/query-core'

import type { UseInfiniteQueryOptions } from './types'

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = UseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> & {
  initialData?:
    | undefined
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | InitialDataFunction<
        NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
      >
}

export type UnusedSkipTokenInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = OmitKeyof<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryFn'
> & {
  queryFn?: Exclude<
    UseInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >['queryFn'],
    SkipToken | undefined
  >
}

export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = UseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> & {
  initialData:
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
    | undefined
}

/**
 * You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
 * These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
 * `options.queryKey` is required and is the query key to generate options for.
 *
 * @example
 * ```tsx
 * import { infiniteQueryOptions } from '@tanstack/preact-query'
 *
 * export const projectsOptions = infiniteQueryOptions({
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextId,
 * })
 * ```
 *
 * @example
 * A parameterized factory, reused across a hook and an imperative call with the same cache entry:
 * ```tsx
 * import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/preact-query'
 *
 * export const commentsOptions = (postId: string) =>
 *   infiniteQueryOptions({
 *     queryKey: ['post', postId, 'comments'],
 *     queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   })
 *
 * function Comments({ postId }: { postId: string }) {
 *   const { data } = useInfiniteQuery(commentsOptions(postId))
 *   return <>{data.pages.map((page) => page.comments.map((c) => <p key={c.id}>{c.text}</p>))}</>
 * }
 *
 * // Elsewhere, e.g. to warm the cache before rendering `<Comments>`:
 * queryClient.prefetchInfiniteQuery(commentsOptions(postId))
 * ```
 */
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
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
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>

/**
 * You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
 * These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
 * `options.queryKey` is required and is the query key to generate options for.
 *
 * @example
 * ```tsx
 * import { infiniteQueryOptions } from '@tanstack/preact-query'
 *
 * export const projectsOptions = infiniteQueryOptions({
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextId,
 * })
 * ```
 *
 * @example
 * A parameterized factory, reused across a hook and an imperative call with the same cache entry:
 * ```tsx
 * import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/preact-query'
 *
 * export const commentsOptions = (postId: string) =>
 *   infiniteQueryOptions({
 *     queryKey: ['post', postId, 'comments'],
 *     queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   })
 *
 * function Comments({ postId }: { postId: string }) {
 *   const { data } = useInfiniteQuery(commentsOptions(postId))
 *   return <>{data.pages.map((page) => page.comments.map((c) => <p key={c.id}>{c.text}</p>))}</>
 * }
 *
 * // Elsewhere, e.g. to warm the cache before rendering `<Comments>`:
 * queryClient.prefetchInfiniteQuery(commentsOptions(postId))
 * ```
 */
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
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
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>

/**
 * You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
 * These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
 * `options.queryKey` is required and is the query key to generate options for.
 *
 * @example
 * ```tsx
 * import { infiniteQueryOptions } from '@tanstack/preact-query'
 *
 * export const projectsOptions = infiniteQueryOptions({
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextId,
 * })
 * ```
 *
 * @example
 * A parameterized factory, reused across a hook and an imperative call with the same cache entry:
 * ```tsx
 * import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/preact-query'
 *
 * export const commentsOptions = (postId: string) =>
 *   infiniteQueryOptions({
 *     queryKey: ['post', postId, 'comments'],
 *     queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   })
 *
 * function Comments({ postId }: { postId: string }) {
 *   const { data } = useInfiniteQuery(commentsOptions(postId))
 *   return <>{data.pages.map((page) => page.comments.map((c) => <p key={c.id}>{c.text}</p>))}</>
 * }
 *
 * // Elsewhere, e.g. to warm the cache before rendering `<Comments>`:
 * queryClient.prefetchInfiniteQuery(commentsOptions(postId))
 * ```
 */
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>

export function infiniteQueryOptions(options: unknown) {
  return options
}
