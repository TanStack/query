import {
  NgZone,
  VERSION,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core'
import {
  QueryClient,
  notifyManager,
  shouldThrowError,
} from '@tanstack/query-core'
import { signalProxy } from './signal-proxy'
import { injectIsRestoring } from './inject-is-restoring'
import { PENDING_TASKS } from './pending-tasks-compat'
import type { PendingTaskRef } from './pending-tasks-compat'
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
  const ngZone = inject(NgZone)
  const pendingTasks = inject(PENDING_TASKS)
  const queryClient = inject(QueryClient)
  const isRestoring = injectIsRestoring()

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

  let pendingTaskRef: PendingTaskRef | null = null
  // A fetch can start synchronously (on subscribe, or when setOptions enables a dependent query),
  // but the first 'fetching' notification reaches the subscriber a notifyManager schedule turn
  // later (setTimeout(0) by default). Registering the pending task only in the subscriber leaves
  // that turn uncovered: with zoneless change detection, `ApplicationRef.whenStable()` can resolve
  // inside it and Angular SSR serializes before the query's state is applied. Register eagerly at
  // every point a fetch may have started instead.
  const trackFetch = (
    observer: QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  ) => {
    if (observer.getCurrentResult().fetchStatus === 'fetching') {
      pendingTaskRef ??= pendingTasks.add()
    }
  }

  effect(
    (onCleanup) => {
      const observer = observerSignal()
      const defaultedOptions = defaultedOptionsSignal()

      untracked(() => {
        observer.setOptions(defaultedOptions)
        trackFetch(observer)
      })
      onCleanup(() => {
        ngZone.run(() => resultFromSubscriberSignal.set(null))
      })
    },
    {
      // Set allowSignalWrites to support Angular < v19
      // Set to undefined to avoid warning on newer versions
      allowSignalWrites: VERSION.major < '19' || undefined,
    },
  )

  effect((onCleanup) => {
    // observer.trackResult is not used as this optimization is not needed for Angular
    const observer = observerSignal()

    const unsubscribe = isRestoring()
      ? () => undefined
      : untracked(() =>
          ngZone.runOutsideAngular(() => {
            return observer.subscribe(
              notifyManager.batchCalls((state) => {
                ngZone.run(() => {
                  if (state.fetchStatus === 'fetching' && !pendingTaskRef) {
                    pendingTaskRef = pendingTasks.add()
                  }

                  try {
                    if (
                      state.isError &&
                      !state.isFetching &&
                      shouldThrowError(observer.options.throwOnError, [
                        state.error,
                        observer.getCurrentQuery(),
                      ])
                    ) {
                      ngZone.onError.emit(state.error)
                      throw state.error
                    }
                    resultFromSubscriberSignal.set(state)
                  } finally {
                    // Released only after the state is written to the signal (or the error is
                    // rethrown): releasing first exposes one synchronous statement in which the
                    // pending-task ledger is empty while the rendered view is still stale — with
                    // zoneless change detection, `whenStable()` latches in that statement and SSR
                    // serializes the stale view.
                    if (state.fetchStatus === 'idle' && pendingTaskRef) {
                      pendingTaskRef()
                      pendingTaskRef = null
                    }
                  }
                })
              }),
            )
          }),
        )

    if (!isRestoring()) {
      untracked(() => trackFetch(observer))
    }

    onCleanup(() => {
      if (pendingTaskRef) {
        pendingTaskRef()
        pendingTaskRef = null
      }
      unsubscribe()
    })
  })

  return signalProxy(
    computed(() => {
      const subscriberResult = resultFromSubscriberSignal()
      const optimisticResult = optimisticResultSignal()
      const result = subscriberResult ?? optimisticResult

      // Wrap methods to ensure observer has latest options before execution
      const observer = observerSignal()

      const originalRefetch = result.refetch
      return {
        ...result,
        refetch: ((...args: Parameters<typeof originalRefetch>) => {
          observer.setOptions(defaultedOptionsSignal())
          const refetchResult = originalRefetch(...args)
          trackFetch(observer)
          return refetchResult
        }) as typeof originalRefetch,
      }
    }),
  )
}
