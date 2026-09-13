import type {
  DeepUnwrapRef,
  MaybeRef,
  MaybeRefDeep,
  MaybeRefOrGetter,
  ShallowOption,
} from './types'
import type {
  DefaultError,
  InitialDataFunction,
  NonUndefinedGuard,
  OmitKeyof,
  QueryBooleanOption,
  QueryKey,
  QueryKeyWithDataTag,
  QueryObserverOptions,
} from '@tanstack/query-core'

// Widen `SkipToken`'s `unique symbol` to `symbol` so it survives a `queryFn: cond ? fn : skipToken`
// ternary inside a whole-options getter or a `computed` — see `SkipTokenForUseQueries` in `useQueries.ts`.
// Only `UseQueryOptions` (the *input* type) widens: `QueryOptions` keeps `unique symbol` so the object
// `queryOptions()` hands back still satisfies `QueryClient` methods like `fetchQuery`/`invalidateQueries`.
type SkipTokenForUseQuery = symbol

/**
 * The plain, unwrapped options that `queryOptions` hands back, and what `useQuery`, `useQueries`, and the
 * `queryClient` methods see once `ref`s have been resolved. `enabled` and `queryKey` track reactive
 * dependencies automatically as a `ref`, a plain value, or a reactive getter (`() => ...`). Every other
 * option — including `queryFn` — is a plain value here; to pass `queryFn` as a `ref`/`computed`, or to close
 * over reactive state in any other option, use {@link UseQueryOptions} directly, or pass a getter for the
 * whole options object instead (`useQuery(() => ({ ... }))`).
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryData - The type of data stored in the cache, before `select` runs. Defaults to
 * `TQueryFnData` and can be configured independently of it.
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
 * The options accepted by `queryOptions`, `useQuery`, and the other query hooks. `enabled` tracks reactive
 * dependencies automatically as a `ref`, a plain value, or a reactive getter (`() => ...`). `queryKey` reacts
 * through a `ref` or a reactive getter for the array itself, or `ref`s and reactive getters as individual
 * entries. `queryFn` reacts through a `ref` or a `computed`, but never a bare getter, since a function there
 * is the query function itself. Other options are read once when passed as a plain value, and stay reactive
 * when passed as a `ref` or a `computed`.
 *
 * If you instead pass a getter for the whole options object (`useQuery(() => ({ ... }))`), every option
 * inside it — including `staleTime`, `retry`, and `select` — is re-evaluated whenever the getter's own
 * reactive dependencies change, since the entire object is recomputed.
 *
 * `select` only re-runs when `data` changes, or when the `select` function's own reference changes. Since a
 * Vue `setup()` function runs only once per component instance, an inline `select` function passed directly
 * to `queryOptions`/`useQuery` already has a stable reference across reactive updates. An inline `select`
 * created inside a whole-options getter is recreated — and so can change reference — every time that getter
 * re-evaluates.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryData - The type of data stored in the cache, before `select` runs. Defaults to
 * `TQueryFnData` and can be configured independently of it.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type UseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = MaybeRef<
  {
    [Property in keyof QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >]: Property extends 'enabled' | 'queryKey'
      ? QueryOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          TQueryKey
        >[Property]
      : Property extends 'queryFn'
        ? MaybeRefDeep<
            | QueryOptions<
                TQueryFnData,
                TError,
                TData,
                TQueryData,
                TQueryKey
              >[Property]
            | SkipTokenForUseQuery
          >
        : MaybeRefDeep<
            QueryOptions<
              TQueryFnData,
              TError,
              TData,
              TQueryData,
              TQueryKey
            >[Property]
          >
  } & ShallowOption
>

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
> = OmitKeyof<
  QueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'queryFn'
> & {
  queryFn?: MaybeRefDeep<
    | QueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        TQueryKey
      >['queryFn']
    | SkipTokenForUseQuery
  >
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
> = OmitKeyof<
  QueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'queryFn'
> & {
  queryFn?: MaybeRefDeep<
    | QueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        TQueryKey
      >['queryFn']
    | SkipTokenForUseQuery
  >
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
> = QueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
} & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

export type DefinedInitialQueryOptionsWithDataTag<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
} & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

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
 * // Pass the getter itself, not `postOptions()`, so the query keeps reacting to `postId` changes.
 * const { data } = useQuery(postOptions)
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
 * import { queryOptions, useQuery, useQueryClient } from '@tanstack/vue-query'
 *
 * const postId = ref(1)
 * const postOptions = queryOptions(() => ({
 *   queryKey: ['post', postId.value],
 *   queryFn: () => fetchPost(postId.value),
 * }))
 *
 * // Pass the getter itself, not `postOptions()`, so the query keeps reacting to `postId` changes.
 * const { data } = useQuery(postOptions)
 * const queryClient = useQueryClient()
 * // Here, call `postOptions()` so `invalidateQueries` reads the current `queryKey` right away.
 * queryClient.invalidateQueries(postOptions())
 * </script>
 * ```
 *
 * @example
 * A parameterized factory that disables the query, type safe, until `postId` is set. The whole-options getter
 * re-evaluates `queryFn` on every change to `postId`. `queryFn` can also be a `computed`, but never a bare
 * getter, since a function there is the query function itself:
 * ```vue
 * <script setup lang="ts">
 * import { queryOptions, skipToken, useQuery } from '@tanstack/vue-query'
 *
 * function postOptions(postId: number | undefined) {
 *   return queryOptions(() => ({
 *     queryKey: ['post', postId],
 *     queryFn: postId != null ? () => fetchPost(postId) : skipToken,
 *   }))
 * }
 *
 * const props = defineProps<{ postId: number | undefined }>()
 * const { data, isLoading, isError, error } = useQuery(postOptions(props.postId))
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
