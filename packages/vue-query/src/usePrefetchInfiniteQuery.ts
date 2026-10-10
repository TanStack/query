import { getCurrentScope, unref, watchEffect } from 'vue-demi'
import { noop } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type {
  DefaultError,
  DistributiveOmit,
  InfiniteData,
  InfiniteQueryExecuteOptions,
  InfiniteQueryMode,
  QueryKey,
  SkipToken,
} from '@tanstack/query-core'
import type { QueryClient } from './queryClient'
import type { MaybeRefDeep, MaybeRefOrGetter } from './types'

/**
 * The options accepted by `usePrefetchInfiniteQuery` — everything you can pass to `queryClient.infiniteQuery`,
 * except that `queryFn` can't be `skipToken`.
 */
export type UsePrefetchInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = DistributiveOmit<
  InfiniteQueryExecuteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    TMode
  >,
  'queryFn'
> & {
  queryFn?: Exclude<
    InfiniteQueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
    >['queryFn'],
    SkipToken
  >
}

/**
 * Checks whether an option was passed as a getter function.
 * @param value - The option value.
 * @returns `true` if `value` is a function.
 */
function isGetter<T>(value: MaybeRefOrGetter<T>): value is () => T {
  return typeof value === 'function'
}

/**
 * `usePrefetchInfiniteQuery` does not return anything — it fires a prefetch as a reactive side effect, useful
 * for kicking off a fetch ahead of the component that will actually render the data with `useInfiniteQuery`.
 * You can pass everything to `usePrefetchInfiniteQuery` that you can pass to `queryClient.infiniteQuery`,
 * though `queryKey`, `initialPageParam`, and `getNextPageParam` are always required, and `queryFn` is required
 * unless a default query function has been defined.
 *
 * `getNextPageParam` receives both the last page of the infinite list of data and the full array of all pages,
 * as well as pageParam information, and should return a single variable that will be passed to your query
 * function as `context.pageParam`. Return `undefined` or `null` to indicate there is no next page available.
 *
 * The prefetch is skipped if the query already has any cached state — including a `pending`/`error` state left
 * over from a previous attempt — so it won't refetch data that's already there or already in flight. It
 * re-runs whenever a reactive dependency in `options` (built with `infiniteQueryOptions`, for example) changes.
 *
 * Fire this during render, before a suspense boundary that wraps a component using `useInfiniteQuery`'s
 * `suspense()` — see the {@link https://tanstack.com/query/latest/docs/framework/vue/guides/suspense | Suspense guide}.
 * @param options - A `ref`, plain value, or reactive getter resolving to the
 * {@link UsePrefetchInfiniteQueryOptions} to use — everything you can pass to `queryClient.infiniteQuery`.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
 * will be used.
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { infiniteQueryOptions, usePrefetchInfiniteQuery } from '@tanstack/vue-query'
 * import Projects from './Projects.vue'
 *
 * const projectsOptions = infiniteQueryOptions({
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextId,
 * })
 *
 * // Fire the prefetch as soon as this component runs, before `Projects` mounts and calls `useInfiniteQuery`.
 * usePrefetchInfiniteQuery(projectsOptions)
 * </script>
 *
 * <template>
 *   <Projects />
 * </template>
 * ```
 */
export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: MaybeRefOrGetter<
    MaybeRefDeep<
      UsePrefetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam,
        undefined
      >
    >
  >,
  queryClient?: QueryClient,
): void
export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: MaybeRefOrGetter<
    MaybeRefDeep<
      UsePrefetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam,
        InfiniteQueryMode
      >
    >
  >,
  queryClient?: QueryClient,
): void
export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = InfiniteQueryMode | undefined,
>(
  options: MaybeRefOrGetter<
    MaybeRefDeep<
      UsePrefetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam,
        TMode
      >
    >
  >,
  queryClient?: QueryClient,
): void {
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const client = queryClient || useQueryClient()

  watchEffect(() => {
    const resolvedOptions = isGetter(options) ? options() : unref(options)

    const clonedOptions: UsePrefetchInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
    > = cloneDeepUnref(resolvedOptions)

    if (!client.getQueryState(clonedOptions.queryKey)) {
      void client.infiniteQuery(clonedOptions).then(noop).catch(noop)
    }
  })
}
