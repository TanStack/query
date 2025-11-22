import { DestroyRef, NgZone, PendingTasks, computed, effect, inject, linkedSignal, untracked, } from '@angular/core'
import { QueryClient, notifyManager, shouldThrowError, } from '@tanstack/query-core'
import { signalProxy } from './signal-proxy'
import { injectIsRestoring } from './inject-is-restoring'
import type {
  DefaultedQueryObserverOptions,
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
  const ngZone = inject(NgZone)
  const pendingTasks = inject(PendingTasks)
  const queryClient = inject(QueryClient)
  const isRestoring = injectIsRestoring()
  const destroyRef = inject(DestroyRef)

  let observer: QueryObserver<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > | null = null

  /**
   * Signal that has the default options from query client applied
   * computed() is used so signals can be inserted into the options
   * making it reactive. Wrapping options in a function ensures embedded expressions
   * are preserved and can keep being applied after signal changes
   */
  const defaultedOptionsSignal = computed(() => {
    const defaultedOptions = queryClient.defaultQueryOptions(optionsFn())
    defaultedOptions._optimisticResults = isRestoring()
      ? 'isRestoring'
      : 'optimistic'
    return defaultedOptions
  })

  const trackObserverResult = (
    result: QueryObserverResult<TData, TError>,
    notifyOnChangeProps?: DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >['notifyOnChangeProps'],
  ) => {
    if (!observer) {
      throw new Error('Observer is not initialized')
    }

    const trackedResult = observer.trackResult(result)

    if (!notifyOnChangeProps) {
      autoTrackResultProperties(trackedResult)
    }

    return trackedResult
  }

  const autoTrackResultProperties = (
    result: QueryObserverResult<TData, TError>,
  ) => {
    for (const key of Object.keys(result) as Array<
      keyof QueryObserverResult<TData, TError>
    >) {
      if (key === 'promise') continue
      const value = result[key]
      if (typeof value === 'function') continue
      // Access value once so QueryObserver knows this prop is tracked.
      void value
    }
  }

  const createOrUpdateObserver = (
    options: DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ) => {
    if (observer) {
      observer.setOptions(options)
      return
    }

    observer = new Observer(queryClient, options)
    let taskCleanupRef: (() => void) | null = null

    const unsubscribe = observer.subscribe(
      notifyManager.batchCalls((state) => {
        ngZone.run(() => {
          if (state.fetchStatus === 'fetching' && !taskCleanupRef) {
            taskCleanupRef = pendingTasks.add()
          }

          if (state.fetchStatus === 'idle' && taskCleanupRef) {
            taskCleanupRef()
            taskCleanupRef = null
          }

          if (
            state.isError &&
            !state.isFetching &&
            shouldThrowError(observer!.options.throwOnError, [
              state.error,
              observer!.getCurrentQuery(),
            ])
          ) {
            ngZone.onError.emit(state.error)
            throw state.error
          }
          const trackedState = trackObserverResult(
            state,
            observer!.options.notifyOnChangeProps,
          )
          resultSignal.set(trackedState)
        })
      }),
    )
    destroyRef.onDestroy(() => {
      unsubscribe()
      taskCleanupRef?.()
    })
  }

  const resultSignal = linkedSignal({
    source: defaultedOptionsSignal,
    computation: () => {
      if (!observer) throw new Error('Observer is not initialized')
      const defaultedOptions = defaultedOptionsSignal()
      const result = observer.getOptimisticResult(defaultedOptions)
      return trackObserverResult(result, defaultedOptions.notifyOnChangeProps)
    },
  })

  // Effect to initialize the observer and set options when options change
  effect(() => {
    const defaultedOptions = defaultedOptionsSignal()
    if (isRestoring()) return

    untracked(() => {
      createOrUpdateObserver(defaultedOptions)
    })
  })

  return signalProxy(resultSignal.asReadonly())
}
