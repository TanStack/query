import { QueryObserver } from '@tanstack/query-core'
import { observerKey } from './queryDescriptor'
import { queryPolicy } from './queryPolicy'
import type {
  DefaultError,
  DefaultQueryFn,
  InitialDataFunction,
  NonUndefinedGuard,
  OmitKeyof,
  QueryFunction,
  QueryKey,
  QueryKeyWithDataTag,
  SkipToken,
} from '@tanstack/query-core'
import type { QueryDescriptor } from './queryDescriptor'
import type { SuspenseControls } from './suspenseQuery'
import type { UseQueryOptions } from './types'

/**
 * The options accepted by the `queryOptions` overload selected when `initialData` is omitted, may be
 * `undefined`, or is a function that may return `undefined` — `data` may be `undefined` while the query is
 * `pending`.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  /**
   * If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
   * created or cached yet). If set to a function, the function will be called **once** during the shared/root
   * query initialization, and be expected to synchronously return the initial data. Initial data is
   * considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
   * cache.
   */
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
}

/**
 * The options accepted by the `queryOptions` overload selected when `queryFn` is not `skipToken` and
 * `initialData` is omitted, may be `undefined`, or is a function that may return `undefined` — same as
 * {@link UndefinedInitialDataOptions}, but `queryFn` may not be `skipToken`.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export interface UnusedSkipTokenOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends OmitKeyof<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryFn'
> {
  /** The query function or the configured client default. */
  queryFn: Exclude<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>['queryFn'],
    SkipToken
  >
}

/**
 * The options accepted by the `queryOptions` overload selected when `initialData` is known to be defined —
 * `data` is never `undefined` (unless a `select` changes `TData` to include `undefined`).
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryFn'> & {
  /**
   * If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
   * created or cached yet). If set to a function, the function will be called **once** during the shared/root
   * query initialization, and be expected to synchronously return the initial data. Initial data is
   * considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
   * cache.
   */
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
  queryFn: QueryFunction<TQueryFnData, TQueryKey> | DefaultQueryFn
}

/** Identifies the observer selected at definition time by queryOptions. */
export type QueryMode = QueryDescriptor<typeof QueryObserver>

type QueryOptionsFactory<TPolicy> = {
  /**
   * Creates a regular query descriptor for `useQuery`. The tagged key also carries the cache data
   * and error types into client operations.
   *
   * This overload is selected when `initialData` is known to be defined, so the resulting `data` is never
   * `undefined` (unless a `select` changes `TData` to include `undefined`).
   * @param options - The {@link DefinedInitialDataOptions} to use — everything you can pass to `useQuery`, with `initialData` known to be defined.
   * @returns A descriptor with its observer and a typed key, so that `queryKey` carries the inferred data type.
   * @see {@link useQuery} to run a query with these options.
   * @see [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.
   * @example
   * ```tsx
   * import { queryOptions, useQuery } from '@tanstack/preact-query'
   *
   * export const postsOptions = queryOptions({
   *   queryKey: ['posts'],
   *   queryFn: fetchPosts,
   *   initialData: [],
   * })
   *
   * function Posts() {
   *   // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
   *   // so the list stays visible alongside the error.
   *   const { data, status, error } = useQuery(postsOptions)
   *
   *   return (
   *     <div>
   *       {status === 'error' ? <span>Error: {error.message}</span> : null}
   *       <ul>
   *         {data.map((post) => <li key={post.id}>{post.title}</li>)}
   *       </ul>
   *     </div>
   *   )
   * }
   * ```
   */
  <
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
      TPolicy,
  ): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
    QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> &
    QueryMode &
    TPolicy

  /**
   * Creates a regular query descriptor for `useQuery`. The tagged key also carries the cache data
   * and error types into client operations.
   * @param options - The {@link UnusedSkipTokenOptions} to use — everything you can pass to `useQuery`.
   * @returns A descriptor with its observer and a typed key, so that `queryKey` carries the inferred data type.
   * @see {@link useQuery} to run a query with these options.
   * @see [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.
   * @example
   * A parameterized factory, so the same options object can be reused per `id`:
   * ```tsx
   * import { queryOptions, useQuery } from '@tanstack/preact-query'
   *
   * export const postOptions = (id: string) =>
   *   queryOptions({
   *     queryKey: ['post', id],
   *     queryFn: () => fetchPost(id),
   *   })
   *
   * function Post({ id }: { id: string }) {
   *   const { data, status, error } = useQuery(postOptions(id))
   *
   *   if (status === 'pending') return 'Loading...'
   *   if (status === 'error') return <span>Error: {error.message}</span>
   *
   *   return <h1>{data.title}</h1>
   * }
   * ```
   */
  <
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> &
      TPolicy,
  ): UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> &
    QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> &
    QueryMode &
    TPolicy

  /**
   * Creates a regular query descriptor for `useQuery`. The tagged key also carries the cache data
   * and error types into client operations.
   * @param options - The {@link UndefinedInitialDataOptions} to use — everything you can pass to `useQuery`.
   * @returns A descriptor with its observer and a typed key, so that `queryKey` carries the inferred data type.
   * @remarks This is the only overload that accepts `queryFn: skipToken`, shown below.
   * @see {@link useQuery} to run a query with these options.
   * @see [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.
   * @example
   * A parameterized factory, so the same options object can be reused per `id`:
   * ```tsx
   * import { queryOptions, useQuery } from '@tanstack/preact-query'
   *
   * export const postOptions = (id: string) =>
   *   queryOptions({
   *     queryKey: ['post', id],
   *     queryFn: () => fetchPost(id),
   *   })
   *
   * function Post({ id }: { id: string }) {
   *   const { data, status, error } = useQuery(postOptions(id))
   *
   *   if (status === 'pending') return 'Loading...'
   *   if (status === 'error') return <span>Error: {error.message}</span>
   *
   *   return <h1>{data.title}</h1>
   * }
   * ```
   * @example
   * A factory that disables the query, type safe, until `postId` is set:
   * ```tsx
   * import { queryOptions, skipToken, useQuery } from '@tanstack/preact-query'
   *
   * export const postOptions = (postId: number | undefined) =>
   *   queryOptions({
   *     queryKey: ['post', postId],
   *     queryFn: postId != null ? () => fetchPost(postId) : skipToken,
   *   })
   *
   * function Post({ postId }: { postId: number | undefined }) {
   *   const { data, status, fetchStatus, error } = useQuery(postOptions(postId))
   *
   *   if (postId == null) return 'Select a post'
   *   if (status === 'pending' && fetchStatus === 'fetching') return 'Loading...'
   *   if (status === 'error') return <span>Error: {error.message}</span>
   *
   *   return <h1>{data?.title}</h1>
   * }
   * ```
   */
  <
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: UndefinedInitialDataOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey
    > &
      TPolicy,
  ): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
    QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> &
    QueryMode &
    TPolicy
}

/**
 * Prepares a descriptor and tags its cache key with the data and error types.
 * @param options - The fetcher and its configuration for the selected observer.
 * @returns A new descriptor backed by QueryObserver.
 */
export const queryOptions: QueryOptionsFactory<SuspenseControls> &
  QueryOptionsFactory<unknown> = <T extends object>(options: T) => ({
  ...options,
  renderPolicy: queryPolicy,
  [observerKey]: QueryObserver,
})
