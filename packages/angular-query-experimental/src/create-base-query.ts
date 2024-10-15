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
import { injectQueryClient } from './inject-query-client'
import { injectIsRestoring } from './inject-is-restoring'
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
  optionsFn: (
    client: QueryClient,
  ) => CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
): CreateBaseQueryResult<TData, TError> {
  const injector = inject(Injector)
  return lazyInit(() => {
    const ngZone = injector.get(NgZone)
    const destroyRef = injector.get(DestroyRef)
    const queryClient = injectQueryClient({ injector })
    const isRestoring =
      injectIsRestoring({ injector, optional: true }) ?? computed(() => false)

    /**
     * Signal that has the default options from query client applied
     * computed() is used so signals can be inserted into the options
     * making it reactive. Wrapping options in a function ensures embedded expressions
     * are preserved and can keep being applied after signal changes
     */
    const defaultedOptionsSignal = computed(() => {
      const options = runInInjectionContext(injector, () =>
        optionsFn(queryClient),
      )
      const defaultedOptions = queryClient.defaultQueryOptions(options)
      defaultedOptions._optimisticResults = isRestoring()
        ? 'isRestoring'
        : 'optimistic'
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

    effect(
      () => {
        const defaultedOptions = defaultedOptionsSignal()
        observer.setOptions(defaultedOptions, {
          // Do not notify on updates because of changes in the options because
          // these changes should already be reflected in the optimistic result.
          listeners: false,
        })
        untracked(() => {
          resultSignal.set(observer.getOptimisticResult(defaultedOptions))
        })
      },
      {
        injector,
      },
    )

    // observer.trackResult is not used as this optimization is not needed for Angular
    effect(
      () => {
        const unsubscribe = isRestoring()
          ? () => undefined
          : observer.subscribe(
              notifyManager.batchCalls(
                (state: QueryObserverResult<TData, TError>) => {
                  ngZone.run(() => {
                    if (
                      state.isError &&
                      !state.isFetching &&
                      shouldThrowError(observer.options.throwOnError, [
                        state.error,
                        observer.getCurrentQuery(),
                      ])
                    ) {
                      throw state.error
                    }
                    untracked(() => resultSignal.set(state))
                  })
                },
              ),
            )

        destroyRef.onDestroy(unsubscribe)
      },
      {
        injector,
      },
    )

    return signalProxy(resultSignal) as CreateBaseQueryResult<TData, TError>
  })
}
