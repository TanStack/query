import {
  DestroyRef,
  Injector,
  NgZone,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
  untracked,
} from '@angular/core'
import { notifyManager } from '@tanstack/query-core'
import { signalProxy } from './signal-proxy'
import { shouldThrowError } from './util'
import { lazyInit } from './util/lazy-init/lazy-init'
import type {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
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
  const ngZone = inject(NgZone)

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
      })

      // observer.trackResult is not used as this optimization is not needed for Angular
      const unsubscribe = observer.subscribe(
        notifyManager.batchCalls(
          (state: QueryObserverResult<TData, TError>) => {
            ngZone.run(() => {
              if (
                state.isError &&
                !state.isFetching &&
                // !isRestoring() && // todo: enable when client persistence is implemented
                shouldThrowError(observer.options.throwOnError, [
                  state.error,
                  observer.getCurrentQuery(),
                ])
              ) {
                throw state.error
              }
              resultSignal.set(state)
            })
          },
        ),
      )
      destroyRef.onDestroy(unsubscribe)

      return signalProxy(resultSignal) as CreateBaseQueryResult<TData, TError>
    })
  })
}
