import {
  DestroyRef,
  Injector,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
  untracked,
} from '@angular/core'
import { notifyManager } from '@tanstack/query-core'
import { signalProxy } from './signal-proxy'
import { lazyInit } from './lazy-init'
import type { QueryClient, QueryKey, QueryObserver } from '@tanstack/query-core'
import type { CreateBaseQueryOptions, CreateBaseQueryResult } from './types'

/**
 * Base implementation for `injectQuery` and `injectInfiniteQuery`.
 */
export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: (
    client: QueryClient,
  ) => CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
  queryClient: QueryClient,
): CreateBaseQueryResult<TData, TError> {
  const injector = inject(Injector)

  return lazyInit(() => {
    return runInInjectionContext(injector, () => {
      const destroyRef = inject(DestroyRef)
      /**
       * Signal that has the default options from query client applied
       * computed() is used so signals can be inserted into the options
       * making it reactive. Wrapping options in a function ensures embedded expressions
       * are preserved and can keep being applied after signal changes
       */
      const defaultedOptionsSignal = computed(() => {
        const defaultedOptions = queryClient.defaultQueryOptions(
          options(queryClient),
        )
        defaultedOptions._optimisticResults = 'optimistic'
        return defaultedOptions
      })

      const observer = new Observer<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey
      >(queryClient, defaultedOptionsSignal())

      const resultSignal = signal(
        observer.getOptimisticResult(defaultedOptionsSignal()),
      )

      // Effects should not be called inside reactive contexts
      untracked(() =>
        effect(() => {
          const defaultedOptions = defaultedOptionsSignal()
          observer.setOptions(defaultedOptions, {
            // Do not notify on updates because of changes in the options because
            // these changes should already be reflected in the optimistic result.
            listeners: false,
          })
          untracked(() => {
            resultSignal.set(observer.getOptimisticResult(defaultedOptions))
          })
        }),
      )

      // observer.trackResult is not used as this optimization is not needed for Angular
      const unsubscribe = observer.subscribe(
        notifyManager.batchCalls((val) => resultSignal.set(val)),
      )
      destroyRef.onDestroy(unsubscribe)

      return signalProxy(resultSignal) as CreateBaseQueryResult<TData, TError>
    })
  })
}
