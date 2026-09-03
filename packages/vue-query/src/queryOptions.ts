import type { DeepUnwrapRef, MaybeRefOrGetter, ShallowOption } from './types'
import type {
  DefaultError,
  InitialDataFunction,
  NonUndefinedGuard,
  QueryBooleanOption,
  QueryKey,
  QueryKeyWithDataTag,
  QueryObserverOptions,
} from '@tanstack/query-core'

/**
 * The options accepted by `queryOptions`, `useQuery`, and the other query hooks. `queryKey` and `enabled`
 * track reactive dependencies — pass a `ref`, a plain value, or a reactive getter (`() => ...`) and the query
 * reacts to changes without any extra wiring. Other options are read once and are not reactive.
 *
 * `select` only re-runs when `data` changes, or when the `select` function's own reference changes. Since a
 * Vue `setup()` function runs only once per component instance, an inline `select` function already has a
 * stable reference across reactive updates — you don't need `computed` or a stable reference of your own to
 * avoid re-running it unnecessarily.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryData - The type of data stored in the cache, before `select` runs — equal to `TQueryFnData`
 * unless `select` narrows it.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type QueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = {
  [Property in keyof QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >]: Property extends 'enabled'
    ?
        | MaybeRefOrGetter<boolean | undefined>
        | (() => QueryBooleanOption<
            TQueryFnData,
            TError,
            TQueryData,
            DeepUnwrapRef<TQueryKey>
          >)
    : Property extends 'queryKey'
      ? MaybeRefOrGetter<TQueryKey>
      : QueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          DeepUnwrapRef<TQueryKey>
        >[Property]
} & ShallowOption

/**
 * The options accepted by the `queryOptions` overload selected when no `initialData` is set — `data` may be
 * `undefined` while the query is `pending`.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type UndefinedInitialQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  /**
   * If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
   * created or cached yet). If set to a function, the function will be called **once** during the shared/root
   * query initialization, and be expected to synchronously return the initial data. Initial data is
   * considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
   * cache. Unlike `queryKey`/`enabled`, this is not reactive — it isn't re-evaluated on `ref` changes.
   */
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
}

/**
 * The options accepted by the `queryOptions` overload selected when `initialData` is set — `data` is never
 * `undefined`.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type DefinedInitialQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  /**
   * If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
   * created or cached yet). If set to a function, the function will be called **once** during the shared/root
   * query initialization, and be expected to synchronously return the initial data. Initial data is
   * considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
   * cache. Unlike `queryKey`/`enabled`, this is not reactive — it isn't re-evaluated on `ref` changes.
   */
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
}

export type UndefinedInitialQueryOptionsWithDataTag<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

export type DefinedInitialQueryOptionsWithDataTag<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

/**
 * You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
 * be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
 * is the query key to generate options for.
 *
 * This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.
 *
 * @see {@link useQuery} to run a query with these options.
 * @param options - The {@link DefinedInitialQueryOptions} to use — everything you can pass to `useQuery`, with
 * `initialData` set.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { queryOptions, useQuery } from '@tanstack/vue-query'
 *
 * const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 *   initialData: [],
 * })
 *
 * // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
 * // so the list stays visible alongside the error.
 * const { data, isError, error } = useQuery(postsOptions)
 * </script>
 * ```
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey>

/**
 * Same as the plain-object overload, but for options that close over reactive state (`ref`s read inside the
 * function body). Wrap them in a getter so `queryClient` methods like `invalidateQueries`/`fetchQuery` always
 * read the current values instead of the ones captured when the options were created.
 *
 * @see {@link useQuery} to run a query with these options.
 * @param options - A function returning the {@link DefinedInitialQueryOptions} to use, re-evaluated on demand.
 * @returns A function that returns the same options object, typed so that `queryKey` carries the inferred data
 * type.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { queryOptions, useQuery } from '@tanstack/vue-query'
 *
 * const postId = ref(1)
 * const postOptions = queryOptions(() => ({
 *   queryKey: ['post', postId.value],
 *   queryFn: () => fetchPost(postId.value),
 *   initialData: { id: postId.value, title: '' },
 * }))
 *
 * const { data } = useQuery(postOptions())
 * </script>
 * ```
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: () => DefinedInitialQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): () => DefinedInitialQueryOptionsWithDataTag<
  TQueryFnData,
  TError,
  TData,
  TQueryKey
>

/**
 * You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
 * be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
 * is the query key to generate options for.
 *
 * @see {@link useQuery} to run a query with these options.
 * @param options - The {@link UndefinedInitialQueryOptions} to use — everything you can pass to `useQuery`.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * A parameterized factory, so the same options object can be reused per `id`:
 * ```vue
 * <script setup lang="ts">
 * import { queryOptions, useQuery } from '@tanstack/vue-query'
 *
 * function postOptions(id: string) {
 *   return queryOptions({
 *     queryKey: ['post', id],
 *     queryFn: () => fetchPost(id),
 *   })
 * }
 *
 * const { data, isPending, isError, error } = useQuery(postOptions('1'))
 * </script>
 * ```
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UndefinedInitialQueryOptionsWithDataTag<
  TQueryFnData,
  TError,
  TData,
  TQueryKey
>

/**
 * Same as the plain-object overload, but for options that close over reactive state (`ref`s read inside the
 * function body). Wrap them in a getter so the `queryKey` — and anything else derived from a `ref` — reacts
 * to changes, and so `queryClient` methods like `invalidateQueries`/`fetchQuery` always read the current
 * values instead of the ones captured when the options were created.
 *
 * @see {@link useQuery} to run a query with these options.
 * @param options - A function returning the {@link UndefinedInitialQueryOptions} to use, re-evaluated on
 * demand.
 * @returns A function that returns the same options object, typed so that `queryKey` carries the inferred
 * data type.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { queryOptions, useQuery } from '@tanstack/vue-query'
 *
 * const postId = ref(1)
 * const postOptions = queryOptions(() => ({
 *   queryKey: ['post', postId.value],
 *   queryFn: () => fetchPost(postId.value),
 * }))
 *
 * // Reacts to changes on postId.value, and reads the current queryKey when invalidating.
 * const { data } = useQuery(postOptions())
 * const queryClient = useQueryClient()
 * queryClient.invalidateQueries(postOptions())
 * </script>
 * ```
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: () => UndefinedInitialQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): () => UndefinedInitialQueryOptionsWithDataTag<
  TQueryFnData,
  TError,
  TData,
  TQueryKey
>

export function queryOptions(options: unknown) {
  return options
}
