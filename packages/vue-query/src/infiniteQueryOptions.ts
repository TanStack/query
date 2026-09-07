import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserverOptions,
  NonUndefinedGuard,
  OmitKeyof,
  QueryKey,
  QueryKeyWithDataTag,
} from '@tanstack/query-core'
import type {
  DeepUnwrapRef,
  MaybeRefDeep,
  MaybeRefOrGetter,
  ShallowOption,
} from './types'

// Widen `SkipToken`'s `unique symbol` to `symbol` so it survives a `queryFn: cond ? fn : skipToken` ternary
// inside a whole-options getter or a `computed` — see `SkipTokenForUseQuery` in `queryOptions.ts`. Only the
// `infiniteQueryOptions()` input widens: `InfiniteQueryOptions` keeps `unique symbol` so the object
// `infiniteQueryOptions()` hands back still satisfies `QueryClient` methods like `queryClient.infiniteQuery`.
type SkipTokenForInfiniteQuery = symbol

/**
 * The plain, unwrapped options that `infiniteQueryOptions` hands back, and what `useInfiniteQuery` and the
 * `queryClient` methods see once `ref`s have been resolved. `enabled` and `queryKey` track reactive
 * dependencies automatically as a `ref`, a plain value, or a reactive getter (`() => ...`). Every other
 * option is a plain value here; to close over reactive state in any of them, use {@link UseInfiniteQueryOptions}
 * directly, or pass a getter for the whole options object instead (`useInfiniteQuery(() => ({ ... }))`).
 *
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export type InfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = {
  [Property in keyof InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >]: Property extends 'enabled'
    ? MaybeRefOrGetter<
        InfiniteQueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          DeepUnwrapRef<TQueryKey>,
          TPageParam
        >['enabled']
      >
    : Property extends 'queryKey'
      ? MaybeRefOrGetter<TQueryKey>
      : InfiniteQueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          DeepUnwrapRef<TQueryKey>,
          TPageParam
        >[Property]
} & ShallowOption

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
> = OmitKeyof<
  InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryFn'
> & {
  queryFn?: MaybeRefDeep<
    | InfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >['queryFn']
    | SkipTokenForInfiniteQuery
  >
  initialData?: undefined
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
> = OmitKeyof<
  InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryFn'
> & {
  queryFn?: MaybeRefDeep<
    | InfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >['queryFn']
    | SkipTokenForInfiniteQuery
  >
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

/**
 * You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
 * These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
 * `options.queryKey` is required and is the query key to generate options for.
 *
 * @see {@link useInfiniteQuery} to run an infinite query with these options.
 * @param options - The {@link UndefinedInitialDataInfiniteOptions} to use — everything you can pass to
 * `useInfiniteQuery`.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/vue-query'
 *
 * const projectsOptions = infiniteQueryOptions({
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextId,
 * })
 *
 * const { data, isError, error, fetchNextPage } = useInfiniteQuery(projectsOptions)
 * </script>
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
): InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
  initialData?: undefined
} & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>

/**
 * You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
 * These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
 * `options.queryKey` is required and is the query key to generate options for.
 *
 * This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.
 *
 * @see {@link useInfiniteQuery} to run an infinite query with these options.
 * @param options - The {@link DefinedInitialDataInfiniteOptions} to use — everything you can pass to
 * `useInfiniteQuery`, with `initialData` set.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/vue-query'
 *
 * const projectsOptions = infiniteQueryOptions({
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextId,
 *   initialData: { pages: [], pageParams: [] },
 * })
 *
 * // `data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
 * // list stays visible alongside the error.
 * const { data, isError, error } = useInfiniteQuery(projectsOptions)
 * </script>
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
): InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
  initialData:
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
} & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>

export function infiniteQueryOptions(options: unknown) {
  return options
}
