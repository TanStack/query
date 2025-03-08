import {
  DestroyRef,
  Injector,
  NgZone,
  VERSION,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
  untracked,
} from '@angular/core'
import { QueryClient, notifyManager } from '@tanstack/query-core'
import { signalProxy } from './signal-proxy'
import { shouldThrowError } from './util'
import type {
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { CreateBaseQueryOptions } from './types'

/**
 * Base implementation for `injectQuery` and `injectInfiniteQuery`.
 * @param optionsFn
 * @param Observer
 */
export function createBaseQuery<
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
) {
  const injector = inject(Injector)
  const ngZone = injector.get(NgZone)
  const destroyRef = injector.get(DestroyRef)
  const queryClient = injector.get(QueryClient)

  /**
   * Signal that has the default options from query client applied
   * computed() is used so signals can be inserted into the options
   * making it reactive. Wrapping options in a function ensures embedded expressions
   * are preserved and can keep being applied after signal changes
   */
  const defaultedOptionsSignal = computed(() => {
    const options = runInInjectionContext(injector, () => optionsFn())
    const defaultedOptions = queryClient.defaultQueryOptions(options)
    defaultedOptions._optimisticResults = 'optimistic'
    return defaultedOptions
  })

  const observerSignal = (() => {
    let instance: QueryObserver<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    > | null = null

    return computed(() => {
      return (instance ||= new Observer(queryClient, defaultedOptionsSignal()))
    })
  })()

  const optimisticResultSignal = computed(() =>
    observerSignal().getOptimisticResult(defaultedOptionsSignal()),
  )

  const resultFromSubscriberSignal = signal<QueryObserverResult<
    TData,
    TError
  > | null>(null)

  effect(
    (onCleanup) => {
      const observer = observerSignal()
      const defaultedOptions = defaultedOptionsSignal()

      untracked(() => {
        observer.setOptions(defaultedOptions)
      })
      onCleanup(() => {
        ngZone.run(() => resultFromSubscriberSignal.set(null))
      })
    },
    {
      // Set allowSignalWrites to support Angular < v19
      // Set to undefined to avoid warning on newer versions
      allowSignalWrites: VERSION.major < '19' || undefined,
      injector,
    },
  )

  effect(() => {
    // observer.trackResult is not used as this optimization is not needed for Angular
    const observer = observerSignal()

    untracked(() => {
      const unsubscribe = ngZone.runOutsideAngular(() =>
        observer.subscribe(
          notifyManager.batchCalls((state) => {
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
              resultFromSubscriberSignal.set(state)
            })
          }),
        ),
      )
      destroyRef.onDestroy(unsubscribe)
    })
  })

  return signalProxy(
    computed(() => {
      const subscriberResult = resultFromSubscriberSignal()
      const optimisticResult = optimisticResultSignal()
      return subscriberResult ?? optimisticResult
    }),
  )
}
