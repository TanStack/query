import {
  DestroyRef,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core'
import { notifyManager } from '@tanstack/query-core'
import type { QueryClient, QueryKey, QueryObserver } from '@tanstack/query-core'
import type { CreateBaseQueryOptions, CreateBaseQueryResult } from './types'

/**
 * Base implementation for `createQuery` and `createInfiniteQuery`.
 * @internal
 */
export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: () => CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
  queryClient: QueryClient,
): CreateBaseQueryResult<TData, TError> {
  assertInInjectionContext(createBaseQuery)

  /** Creates a signal that has the default options applied */
  const defaultedOptionsSignal = computed(() => {
    const defaultedOptions = queryClient.defaultQueryOptions(options())
    defaultedOptions._optimisticResults = 'optimistic'
    return defaultedOptions
  })

  /** Creates the observer */
  const observer = new Observer<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >(queryClient, defaultedOptionsSignal())

  effect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(defaultedOptionsSignal(), { listeners: false })
  })

  const result = signal(observer.getCurrentResult())
  const unsubscribe = observer.subscribe(
    notifyManager.batchCalls((val) => {
      result.set(val)
    }),
  )
  const destroyRef = inject(DestroyRef)
  destroyRef.onDestroy(unsubscribe)

  /** Subscribe to changes in result and defaultedOptionsStore */
  return computed(() => {
    // result.set(observer.getOptimisticResult(defaultedOptionsSignal()))
    return !defaultedOptionsSignal().notifyOnChangeProps
      ? observer.trackResult(result())
      : result()
  })
}
