import { InfiniteQueryObserver } from '@tanstack/query-core-pluggable'
import { observerKey } from './queryDescriptor'
import { queryPolicy } from './queryPolicy'
import type {
  DefaultError,
  InfiniteData,
  InitialDataFunction,
  NonUndefinedGuard,
  OmitKeyof,
  QueryKey,
  QueryKeyWithDataTag,
  SkipToken,
} from '@tanstack/query-core-pluggable'
import type { QueryDescriptor } from './queryDescriptor'
import type { SuspenseControls } from './suspenseQuery'
import type { UseInfiniteQueryOptions } from './types'

/**
 * The options accepted by the `infiniteQueryOptions` overload selected when `initialData` is omitted, may be
 * `undefined`, or is a function that may return `undefined` — `data` may be `undefined` while the query is
 * `pending`.
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
 * The options accepted by the `infiniteQueryOptions` overload selected when `queryFn` is not `skipToken` and
 * `initialData` is omitted, may be `undefined`, or is a function that may return `undefined` — same as
 * {@link UndefinedInitialDataInfiniteOptions}, but `queryFn` may not be `skipToken`.
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export interface UnusedSkipTokenInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends OmitKeyof<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryFn'
> {
  /** The query function or the configured client default. */
  queryFn: Exclude<
    UseInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >['queryFn'],
    SkipToken
  >
}

/**
 * The options accepted by the `infiniteQueryOptions` overload selected when `initialData` is known to be
 * defined — `data` is never `undefined` (unless a `select` changes `TData` to include `undefined`).
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
}

/** Identifies the observer selected at definition time by infiniteQueryOptions. */
export type InfiniteQueryMode = QueryDescriptor<typeof InfiniteQueryObserver>

// A private type-only default distinguishes an omitted selector output from an
// explicitly selected value while keeping the public v6 generic parameter order.
declare const unselectedPages: unique symbol
/** Marks an omitted selector type while allowing an inferred page parameter in its default. */
export type UnselectedPages = typeof unselectedPages
/** Preserves a custom projection or supplies the cached pages with their inferred cursor type. */
export type ResolvedPages<TData, TPage, TParam> = TData extends UnselectedPages
  ? InfiniteData<TPage, TParam>
  : TData

type InfiniteQueryOptionsFactory<TPolicy> = {
  /**
   * The factory accepts the fetcher, pagination callbacks, and observer options for the query.
   * These options can be shared across hooks and imperative APIs such as `fetchInfiniteQuery(client, options)`.
   * `options.queryKey` is required and is the query key to generate options for.
   *
   * This overload is selected when `initialData` is known to be defined.
   * @param options - The {@link DefinedInitialDataInfiniteOptions} to use — all paginated observer options, with `initialData` known to be defined.
   * @returns A descriptor with its observer and a typed key, so that `queryKey` carries the inferred data type.
   * @remarks See {@link useQuery} for examples that fetch further pages, from a button click or
   * automatically as the user scrolls.
   * @see {@link useQuery} to run an infinite query with these options.
   * @example
   * ```tsx
   * import { infiniteQueryOptions, useQuery } from '@tanstack/react-query-pluggable'
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
   *   const { data, status, error } = useQuery(projectsOptions)
   *
   *   return (
   *     <div>
   *       {status === 'error' ? <span>Error: {error.message}</span> : null}
   *       <ul>
   *         {data.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
   *       </ul>
   *     </div>
   *   )
   * }
   * ```
   */
  <
    TQueryFnData,
    TError = DefaultError,
    TData = UnselectedPages,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: DefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    > &
      TPolicy,
  ): DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    ResolvedPages<TData, TQueryFnData, TPageParam>,
    TQueryKey,
    TPageParam
  > &
    QueryKeyWithDataTag<
      TQueryKey,
      InfiniteData<TQueryFnData, TPageParam>,
      TError
    > &
    InfiniteQueryMode &
    TPolicy

  /**
   * The factory accepts the fetcher, pagination callbacks, and observer options for the query.
   * These options can be shared across hooks and imperative APIs such as `fetchInfiniteQuery(client, options)`.
   * `options.queryKey` is required and is the query key to generate options for.
   * @param options - The {@link UnusedSkipTokenInfiniteOptions} to use — the fetcher, pagination, and observer options.
   * @returns A descriptor with its observer and a typed key, so that `queryKey` carries the inferred data type.
   * @remarks See {@link useQuery} for examples that fetch further pages, from a button click or
   * automatically as the user scrolls.
   * @see {@link useQuery} to run an infinite query with these options.
   * @example
   * A parameterized factory, so the same options object can be reused per `postId`:
   * ```tsx
   * import { infiniteQueryOptions, useQuery } from '@tanstack/react-query-pluggable'
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
   *   const { data, status, error } = useQuery(commentsOptions(postId))
   *
   *   if (status === 'pending') return 'Loading...'
   *   if (status === 'error') return <span>Error: {error.message}</span>
   *
   *   return (
   *     <ul>
   *       {data.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
   *     </ul>
   *   )
   * }
   * ```
   */
  <
    TQueryFnData,
    TError = DefaultError,
    TData = UnselectedPages,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: UnusedSkipTokenInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    > &
      TPolicy,
  ): UnusedSkipTokenInfiniteOptions<
    TQueryFnData,
    TError,
    ResolvedPages<TData, TQueryFnData, TPageParam>,
    TQueryKey,
    TPageParam
  > &
    QueryKeyWithDataTag<
      TQueryKey,
      InfiniteData<TQueryFnData, TPageParam>,
      TError
    > &
    InfiniteQueryMode &
    TPolicy

  /**
   * The factory accepts the fetcher, pagination callbacks, and observer options for the query.
   * These options can be shared across hooks and imperative APIs such as `fetchInfiniteQuery(client, options)`.
   * `options.queryKey` is required and is the query key to generate options for.
   * @param options - The {@link UndefinedInitialDataInfiniteOptions} to use — the fetcher, pagination, and observer options.
   * @returns A descriptor with its observer and a typed key, so that `queryKey` carries the inferred data type.
   * @remarks See {@link useQuery} for examples that fetch further pages (from a button click or
   * automatically as the user scrolls) and that use `skipToken` to disable the query until `postId` is set.
   * @see {@link useQuery} to run an infinite query with these options.
   * @example
   * A parameterized factory, so the same options object can be reused per `postId`:
   * ```tsx
   * import { infiniteQueryOptions, useQuery } from '@tanstack/react-query-pluggable'
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
   *   const { data, status, error } = useQuery(commentsOptions(postId))
   *
   *   if (status === 'pending') return 'Loading...'
   *   if (status === 'error') return <span>Error: {error.message}</span>
   *
   *   return (
   *     <ul>
   *       {data.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
   *     </ul>
   *   )
   * }
   * ```
   */
  <
    TQueryFnData,
    TError = DefaultError,
    TData = UnselectedPages,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: UndefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    > &
      TPolicy,
  ): UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    ResolvedPages<TData, TQueryFnData, TPageParam>,
    TQueryKey,
    TPageParam
  > &
    QueryKeyWithDataTag<
      TQueryKey,
      InfiniteData<TQueryFnData, TPageParam>,
      TError
    > &
    InfiniteQueryMode &
    TPolicy
}

/**
 * Prepares a descriptor and tags its cache key with the data and error types.
 * @param options - The fetcher and its configuration for the selected observer.
 * @returns A new descriptor backed by InfiniteQueryObserver.
 */
export const infiniteQueryOptions: InfiniteQueryOptionsFactory<SuspenseControls> &
  InfiniteQueryOptionsFactory<unknown> = <T extends object>(options: T) => ({
  ...options,
  renderPolicy: queryPolicy,
  [observerKey]: InfiniteQueryObserver,
})
