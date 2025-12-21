import {
  DestroyRef,
  NgZone,
  PendingTasks,
  computed,
  effect,
  inject,
  linkedSignal,
  untracked,
} from '@angular/core'
import {
  QueryClient,
  notifyManager,
  shouldThrowError,
} from '@tanstack/query-core'
import { signalProxy } from './signal-proxy'
import { injectIsRestoring } from './inject-is-restoring'
import type { MethodKeys} from './signal-proxy';
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
 * @param excludeFunctions
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
  excludeFunctions: ReadonlyArray<string>,
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

  let destroyed = false
  let taskCleanupRef: (() => void) | null = null

  const startPendingTask = () => {
    if (!taskCleanupRef && !destroyed) {
      taskCleanupRef = pendingTasks.add()
    }
  }

  const stopPendingTask = () => {
    if (taskCleanupRef) {
      taskCleanupRef()
      taskCleanupRef = null
    }
  }

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
      throw new Error(OBSERVER_NOT_READY_ERROR)
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

  const setObserverOptions = (
    options: DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ) => {
    if (!observer) {
      observer = new Observer(queryClient, options)
      destroyRef.onDestroy(() => {
        destroyed = true
        stopPendingTask()
      })
    } else {
      observer.setOptions(options)
    }
  }

  const subscribeToObserver = () => {
    if (!observer) {
      throw new Error(OBSERVER_NOT_READY_ERROR)
    }

    const initialState = observer.getCurrentResult()
    if (initialState.fetchStatus !== 'idle') {
      startPendingTask()
    }

    return observer.subscribe((state) => {
      if (state.fetchStatus !== 'idle') {
        startPendingTask()
      } else {
        stopPendingTask()
      }

      queueMicrotask(() => {
        if (destroyed) return
        notifyManager.batch(() => {
          ngZone.run(() => {
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
        })
      })
    })
  }

  const resultSignal = linkedSignal({
    source: defaultedOptionsSignal,
    computation: () => {
      if (!observer) throw new Error(OBSERVER_NOT_READY_ERROR)
      const defaultedOptions = defaultedOptionsSignal()
      const result = observer.getOptimisticResult(defaultedOptions)
      return trackObserverResult(result, defaultedOptions.notifyOnChangeProps)
    },
  })

  effect(() => {
    const defaultedOptions = defaultedOptionsSignal()
    untracked(() => {
      setObserverOptions(defaultedOptions)
    })
  })

  effect((onCleanup) => {
    if (isRestoring()) {
      return
    }
    const unsubscribe = untracked(() => subscribeToObserver())
    onCleanup(() => {
      unsubscribe()
      stopPendingTask()
    })
  })

  return signalProxy(
    resultSignal.asReadonly(),
    excludeFunctions as Array<MethodKeys<QueryObserverResult<TData, TError>>>,
  )
}
const OBSERVER_NOT_READY_ERROR =
  'injectQuery: QueryObserver not initialized yet. Avoid reading the query result or running methods during construction'
