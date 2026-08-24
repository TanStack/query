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
  /**
   * If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
   * created or cached yet). If set to a function, the function will be called **once** during the shared/root
   * query initialization, and be expected to synchronously return the initial data. Initial data is
   * considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
   * cache.
   */
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
  /**
   * `skipToken` is not allowed as a value here — this overload is selected when no `initialData` is set. If
   * you don't intend to run the query yet, omit `queryFn` or use a default query function instead.
   */
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
  /**
   * If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
   * created or cached yet). If set to a function, the function will be called **once** during the shared/root
   * query initialization, and be expected to synchronously return the initial data. Initial data is
   * considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
   * cache.
   */
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
 * This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.
 *
 * @param options - The {@link DefinedInitialDataInfiniteOptions} to use — everything you can pass to `useInfiniteQuery`, with `initialData` set.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```tsx
 * import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/preact-query'
 *
 * export const projectsOptions = infiniteQueryOptions({
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextId,
 *   initialData: { pages: [], pageParams: [] },
 * })
 *
 * function Projects() {
 *   // `data` is never `undefined`, thanks to `initialData`.
 *   const { data } = useInfiniteQuery(projectsOptions)
 *   return <>{data.pages.map((page) => page.projects.map((p) => <p key={p.id}>{p.name}</p>))}</>
 * }
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
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
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
 *   const result = useInfiniteQuery(commentsOptions(postId))
 *   if (!result.isSuccess) return 'Loading...'
 *   return (
 *     <>
 *       {result.data.pages.map((page) => page.comments.map((c) => <p key={c.id}>{c.text}</p>))}
 *     </>
 *   )
 * }
 *
 * // Elsewhere, e.g. to warm the cache before rendering `<Comments>`:
 * queryClient.prefetchInfiniteQuery(commentsOptions(postId))
 * ```
 *
 * @param options - The {@link UnusedSkipTokenInfiniteOptions} to use — everything you can pass to `useInfiniteQuery`.
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
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
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
 *   const result = useInfiniteQuery(commentsOptions(postId))
 *   if (!result.isSuccess) return 'Loading...'
 *   return (
 *     <>
 *       {result.data.pages.map((page) => page.comments.map((c) => <p key={c.id}>{c.text}</p>))}
 *     </>
 *   )
 * }
 *
 * // Elsewhere, e.g. to warm the cache before rendering `<Comments>`:
 * queryClient.prefetchInfiniteQuery(commentsOptions(postId))
 * ```
 *
 * @param options - The {@link UndefinedInitialDataInfiniteOptions} to use — everything you can pass to `useInfiniteQuery`.
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
