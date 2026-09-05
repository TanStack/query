import { QueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefaultError,
  DefinedQueryObserverResult,
  InitialDataFunction,
  NonUndefinedGuard,
  QueryBooleanOption,
  QueryKey,
  QueryObserverOptions,
} from '@tanstack/query-core'
import type { UseBaseQueryReturnType } from './useBaseQuery'
import type {
  DeepUnwrapRef,
  MaybeRef,
  MaybeRefDeep,
  MaybeRefOrGetter,
  ShallowOption,
} from './types'
import type { QueryClient } from './queryClient'

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
        ? MaybeRef<
            QueryObserverOptions<
              TQueryFnData,
              TError,
              TData,
              TQueryData,
              TQueryKey
            >[Property]
          >
        : MaybeRefDeep<
            QueryObserverOptions<
              TQueryFnData,
              TError,
              TData,
              TQueryData,
              DeepUnwrapRef<TQueryKey>
            >[Property]
          >
  } & ShallowOption
>

export type UndefinedInitialQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
}

export type DefinedInitialQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
}

export type UseQueryReturnType<TData, TError> = UseBaseQueryReturnType<
  TData,
  TError
>

export type UseQueryDefinedReturnType<TData, TError> = UseBaseQueryReturnType<
  TData,
  TError,
  DefinedQueryObserverResult<TData, TError>
>

/**
 * This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.
 *
 * `queryKey` and `enabled` track reactive dependencies automatically — pass a `ref`, a plain value, or a
 * reactive getter (`() => ...`) and the query reacts to changes without any extra wiring. Other options are
 * read once and are not reactive.
 *
 * @param options - The {@link DefinedInitialQueryOptions} to use — everything you can pass to `useQuery`, with
 * `initialData` set.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
 * will be used.
 * @returns The current query result, typed so that `data` is never `undefined` (`status` never resolves to
 * `pending` in this overload's type, since `initialData` guarantees data upfront).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useQuery } from '@tanstack/vue-query'
 *
 * // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
 * // so the list stays visible alongside the error.
 * const { data, isError, error } = useQuery({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 *   initialData: [],
 * })
 * </script>
 *
 * <template>
 *   <span v-if="isError">Error: {{ error.message }}</span>
 *   <ul>
 *     <li v-for="post in data" :key="post.id">{{ post.title }}</li>
 *   </ul>
 * </template>
 * ```
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryDefinedReturnType<TData, TError>

/**
 * `queryKey` and `enabled` track reactive dependencies automatically — pass a `ref`, a plain value, or a
 * reactive getter (`() => ...`) and the query reacts to changes without any extra wiring. Other options are
 * read once and are not reactive.
 *
 * @param options - The {@link UndefinedInitialQueryOptions} to use — everything you can pass to `useQuery`.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
 * will be used.
 * @returns The current query result. `status` is `pending` if there is no cached data to display, `error` if
 * the last fetch attempt failed, or `success` if the query has data to display.
 *
 * @example
 * A query key built from a reactive `ref` — the query refetches whenever `postId` changes:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useQuery } from '@tanstack/vue-query'
 *
 * const postId = ref(1)
 * const { status, data, error } = useQuery({
 *   queryKey: ['post', postId],
 *   queryFn: () => fetchPost(postId.value),
 * })
 * </script>
 *
 * <template>
 *   <span v-if="status === 'pending'">Loading...</span>
 *   <span v-else-if="status === 'error'">Error: {{ error.message }}</span>
 *   <h1 v-else>{{ data.title }}</h1>
 * </template>
 * ```
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError>

/**
 * Fallback overload for options whose `initialData` presence isn't statically known — for example, a
 * `ref`/reactive object built up conditionally, rather than a plain object literal. Prefer one of the other
 * overloads when possible, since they infer whether `data` can be `undefined` from `initialData` directly.
 *
 * `queryKey` and `enabled` track reactive dependencies automatically — pass a `ref`, a plain value, or a
 * reactive getter (`() => ...`) and the query reacts to changes without any extra wiring.
 *
 * When `options` itself is a reactive getter, the whole object is re-evaluated on every change to its
 * dependencies, so any option inside it — not just `queryKey` and `enabled` — can change over time.
 *
 * @param options - A `ref`, plain value, or reactive getter resolving to the {@link UseQueryOptions} to use.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
 * will be used.
 * @returns The current query result, with `data` typed as possibly `undefined`.
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: MaybeRefOrGetter<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>
  >,
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError>

export function useQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: MaybeRefOrGetter<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>
  >,
  queryClient?: QueryClient,
):
  | UseQueryReturnType<TData, TError>
  | UseQueryDefinedReturnType<TData, TError> {
  return useBaseQuery(QueryObserver, options, queryClient)
}
