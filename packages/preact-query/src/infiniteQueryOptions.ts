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

/**
 * The options accepted by the `infiniteQueryOptions` overload selected when no `initialData` is set — `data`
 * may be `undefined` while the query is `pending`.
 *
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
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

/**
 * The options accepted by the `infiniteQueryOptions` overload selected when no `initialData` is set and
 * `queryFn` is not `skipToken` — same as {@link UndefinedInitialDataInfiniteOptions}, but `queryFn` may not be
 * `skipToken`.
 *
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
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

/**
 * The options accepted by the `infiniteQueryOptions` overload selected when `initialData` is set — `data` is
 * never `undefined`.
 *
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
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
 * This overload is selected when `initialData` is set.
 *
 * @see {@link useInfiniteQuery} to run an infinite query with these options.
 * @param options - The {@link DefinedInitialDataInfiniteOptions} to use — everything you can pass to `useInfiniteQuery`, with `initialData` set.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 * @remarks See {@link useInfiniteQuery} for examples that fetch further pages, from a button click or
 * automatically as the user scrolls.
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
 *   // `data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
 *   // list stays visible alongside the error.
 *   const { data, isError, error } = useInfiniteQuery(projectsOptions)
 *
 *   return (
 *     <div>
 *       {isError ? <span>Error: {error.message}</span> : null}
 *       <ul>
 *         {data.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
 *       </ul>
 *     </div>
 *   )
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
 * @remarks See {@link useInfiniteQuery} for examples that fetch further pages, from a button click or
 * automatically as the user scrolls.
 *
 * @example
 * A parameterized factory, reused across a hook and an imperative call with the same cache entry:
 * ```tsx
 * import {
 *   infiniteQueryOptions,
 *   noop,
 *   useInfiniteQuery,
 * } from '@tanstack/preact-query'
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
 *   const { data, isPending, isError, error } = useInfiniteQuery(commentsOptions(postId))
 *
 *   if (isPending) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return (
 *     <ul>
 *       {data.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
 *     </ul>
 *   )
 * }
 *
 * // `commentsOptions` also works with imperative APIs like `queryClient.infiniteQuery` —
 * // see `useInfiniteQuery` for an example that warms the cache this way before rendering `<Comments>`.
 * const postId = '1'
 * queryClient.infiniteQuery(commentsOptions(postId)).catch(noop)
 * ```
 *
 * @see {@link useInfiniteQuery} to run an infinite query with these options.
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
 * @remarks See {@link useInfiniteQuery} for examples that fetch further pages (from a button click or
 * automatically as the user scrolls) and that use `skipToken` to disable the query until `postId` is set.
 *
 * @example
 * A parameterized factory, reused across a hook and an imperative call with the same cache entry:
 * ```tsx
 * import {
 *   infiniteQueryOptions,
 *   noop,
 *   useInfiniteQuery,
 * } from '@tanstack/preact-query'
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
 *   const { data, isPending, isError, error } = useInfiniteQuery(commentsOptions(postId))
 *
 *   if (isPending) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return (
 *     <ul>
 *       {data.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
 *     </ul>
 *   )
 * }
 *
 * // `commentsOptions` also works with imperative APIs like `queryClient.infiniteQuery` —
 * // see `useInfiniteQuery` for an example that warms the cache this way before rendering `<Comments>`.
 * const postId = '1'
 * queryClient.infiniteQuery(commentsOptions(postId)).catch(noop)
 * ```
 *
 * @see {@link useInfiniteQuery} to run an infinite query with these options.
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
