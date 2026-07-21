import {
  Injector,
  assertInInjectionContext,
  computed,
  inject,
  runInInjectionContext,
  untracked,
} from '@angular/core'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import {
  createBaseQueryResource,
  normalizeQueryResourceArg,
} from './resource/create-base-query-resource'
import type { Signal } from '@angular/core'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserverResult,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type { CreateBaseQueryOptions } from './types'
import type {
  CreateInfiniteQueryResourceResult,
  InfiniteQueryResourceConfig,
  InfiniteQueryResourceOptionsFn,
  QueryResourceInjectorOptions,
} from './resource/resource-types'

/**
 * Creates an infinite query whose handle is an Angular `Resource`.
 *
 * The resource-shaped counterpart of `injectInfiniteQuery`. Backed by the same
 * `InfiniteQueryObserver` and cache, so the loaded pages dedupe and persist exactly
 * like the signal-proxy based API. Adds the infinite-specific fields
 * (`hasNextPage`/`fetchNextPage`/…) on top of the base resource surface.
 *
 * **Config form.** `queryKey` and `enabled` may be reactive thunks; everything else
 * is read once.
 *
 * ```ts
 * feed = infiniteQueryResource({
 *   queryKey: () => ['feed'],
 *   queryFn: ({ pageParam }) => api.getFeed(pageParam),
 *   initialPageParam: 1,
 *   getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
 * })
 * // feed.value()?.pages, feed.hasNextPage(), feed.fetchNextPage()
 * ```
 * @param config - The infinite query options as a config object with reactive thunks.
 * @param options - Additional configuration such as the `Injector` to use.
 * @returns A resource-shaped infinite query handle.
 */
export function infiniteQueryResource<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  config: InfiniteQueryResourceConfig<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  options?: QueryResourceInjectorOptions,
): CreateInfiniteQueryResourceResult<TData, TError>

/**
 * Creates an infinite query whose handle is an Angular `Resource`.
 *
 * **Options-function form.** Whole-object reactive, identical semantics to
 * `injectInfiniteQuery(() => ({ ... }))`.
 * @param optionsFn - A function that returns the infinite query options.
 * @param options - Additional configuration such as the `Injector` to use.
 * @returns A resource-shaped infinite query handle.
 */
export function infiniteQueryResource<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  optionsFn: InfiniteQueryResourceOptionsFn<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  options?: QueryResourceInjectorOptions,
): CreateInfiniteQueryResourceResult<TData, TError>

export function infiniteQueryResource(
  arg: InfiniteQueryResourceConfig | InfiniteQueryResourceOptionsFn,
  options?: QueryResourceInjectorOptions,
): CreateInfiniteQueryResourceResult {
  !options?.injector && assertInInjectionContext(infiniteQueryResource)
  const injector = options?.injector ?? inject(Injector)
  return runInInjectionContext(injector, () => {
    const optionsFn =
      normalizeQueryResourceArg(arg) as () => CreateBaseQueryOptions
    const { result, base } = createBaseQueryResource(
      optionsFn,
      InfiniteQueryObserver as typeof QueryObserver,
    )
    const infiniteResult = result as unknown as Signal<
      InfiniteQueryObserverResult
    >

    return {
      ...base,
      hasNextPage: computed(() => infiniteResult().hasNextPage),
      hasPreviousPage: computed(() => infiniteResult().hasPreviousPage),
      isFetchingNextPage: computed(() => infiniteResult().isFetchingNextPage),
      isFetchingPreviousPage: computed(
        () => infiniteResult().isFetchingPreviousPage,
      ),
      isFetchNextPageError: computed(
        () => infiniteResult().isFetchNextPageError,
      ),
      isFetchPreviousPageError: computed(
        () => infiniteResult().isFetchPreviousPageError,
      ),
      fetchNextPage: (pageOptions) =>
        untracked(() => infiniteResult().fetchNextPage(pageOptions)),
      fetchPreviousPage: (pageOptions) =>
        untracked(() => infiniteResult().fetchPreviousPage(pageOptions)),
    } as CreateInfiniteQueryResourceResult
  })
}
