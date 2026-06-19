import { computed, inject, resourceFromSnapshots, untracked } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import { createBaseQueryResult } from '../create-base-query'
import { toResourceSnapshot } from './to-resource-snapshot'
import type { Signal } from '@angular/core'
import type {
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { CreateBaseQueryOptions } from '../types'
import type { BaseQueryResource } from './resource-types'

/**
 * Normalize the two accepted argument shapes into the single options-function form
 * that {@link createBaseQueryResult} (and `QueryObserver`) expects:
 *
 * - `() => options` — the power form. Whole-object reactive, returned as-is.
 * - `options` — the config form. The `queryKey` and `enabled` fields may be reactive
 *   thunks; they are resolved inside the returned function so reads register as
 *   reactive dependencies. Every other field is read once.
 */
export function normalizeQueryResourceArg(
  arg: Record<string, any> | (() => Record<string, any>),
): () => Record<string, any> {
  if (typeof arg === 'function') {
    return arg
  }
  return () => {
    const options = { ...arg }
    if (typeof options['queryKey'] === 'function') {
      options['queryKey'] = options['queryKey']()
    }
    // In the config form `enabled` is typed as `boolean | (() => boolean)`; the arity
    // check keeps a core-style `(query) => boolean` predicate working as a passthrough.
    if (
      typeof options['enabled'] === 'function' &&
      options['enabled'].length === 0
    ) {
      options['enabled'] = options['enabled']()
    }
    return options
  }
}

/**
 * Shared engine for `queryResource` and `infiniteQueryResource`.
 *
 * Reuses the exact `QueryObserver`/`QueryClient` machinery behind `injectQuery` (via
 * {@link createBaseQueryResult}) and projects its result onto a real Angular
 * `Resource<T>` through `resourceFromSnapshots`. The query cache stays the single
 * source of truth — `queryResource` and `injectQuery` dedupe against each other.
 * @param optionsFn - The normalized options function.
 * @param Observer - `QueryObserver` or `InfiniteQueryObserver`.
 * @returns The assembled base resource handle plus the underlying result signal (used
 * by `infiniteQueryResource` to add its extra fields).
 */
export function createBaseQueryResource<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  optionsFn: () => CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
): {
  result: Signal<QueryObserverResult<TData, TError>>
  base: BaseQueryResource<TData, TError>
} {
  const queryClient = inject(QueryClient)

  const result = createBaseQueryResult<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >(optionsFn, Observer)

  const resourceRef = resourceFromSnapshots<TData | undefined>(() =>
    toResourceSnapshot(result()),
  )

  const resolveKey = () => untracked(() => optionsFn().queryKey) as TQueryKey

  const base: BaseQueryResource<TData, TError> = {
    // Angular Resource<TData | undefined> surface.
    value: resourceRef.value,
    status: resourceRef.status,
    error: resourceRef.error,
    isLoading: resourceRef.isLoading,
    snapshot: resourceRef.snapshot,
    hasValue: (() =>
      resourceRef.hasValue()) as BaseQueryResource<TData, TError>['hasValue'],

    // TanStack query result fields, projected as signals.
    data: computed(() => result().data),
    queryStatus: computed(() => result().status),
    fetchStatus: computed(() => result().fetchStatus),
    isPending: computed(() => result().isPending),
    isSuccess: computed(() => result().isSuccess),
    isError: computed(() => result().isError),
    isFetching: computed(() => result().isFetching),
    isStale: computed(() => result().isStale),
    isPlaceholderData: computed(() => result().isPlaceholderData),
    failureCount: computed(() => result().failureCount),
    failureReason: computed(() => result().failureReason),
    dataUpdatedAt: computed(() => result().dataUpdatedAt),
    errorUpdatedAt: computed(() => result().errorUpdatedAt),

    // Actions.
    refetch: (options) => untracked(() => result().refetch(options)),
    reload: () => void untracked(() => result().refetch()),
    set: (value) => {
      queryClient.setQueryData<TData>(resolveKey(), value)
    },
    update: (updater) => {
      queryClient.setQueryData<TData>(
        resolveKey(),
        (previous: TData | undefined) => updater(previous),
      )
    },
  }

  return { result, base }
}
