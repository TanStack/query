import {
  DestroyRef,
  NgZone,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core'
import {
  QueryClient,
  noop,
  notifyManager,
  shouldThrowError,
} from '@tanstack/query-core'
import { signalProxy } from './signal-proxy'
import { injectIsRestoring } from './inject-is-restoring'
import { PENDING_TASKS } from './pending-tasks-compat'
import type { PendingTaskRef } from './pending-tasks-compat'
import type { QueryKey, QueryObserver } from '@tanstack/query-core'
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
  const destroyRef = inject(DestroyRef)
  const ngZone = inject(NgZone)
  const pendingTasks = inject(PENDING_TASKS)
  const queryClient = inject(QueryClient)
  const isRestoringSignal = injectIsRestoring()

  /**
   * Signal that has the default options from query client applied
   * computed() is used so signals can be inserted into the options
   * making it reactive. Wrapping options in a function ensures embedded expressions
   * are preserved and can keep being applied after signal changes
   */
  const defaultedOptionsSignal = computed(() => {
    const defaultedOptions = queryClient.defaultQueryOptions(optionsFn())
    defaultedOptions._optimisticResults = isRestoringSignal()
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
      const observerOptions = defaultedOptionsSignal()
      return untracked(() => {
        if (instance) {
          instance.setOptions(observerOptions)
        } else {
          instance = new Observer(queryClient, observerOptions)
        }
        return instance
      })
    })
  })()

  let cleanup: () => void = noop
  let pendingTaskRef: PendingTaskRef | null = null

  /**
   * Returning a writable signal from a computed is similar to `linkedSignal`,
   * but compatible with Angular < 19
   *
   * Compared to `linkedSignal`, this pattern requires extra parentheses:
   * - Accessing value: `result()()`
   * - Setting value: `result().set(newValue)`
   */
  const linkedResultSignal = computed(() => {
    const observer = observerSignal()
    const defaultedOptions = defaultedOptionsSignal()
    const isRestoring = isRestoringSignal()

    return untracked(() => {
      // observer.trackResult is not used as this optimization is not needed for Angular
      const currentResult = observer.getOptimisticResult(defaultedOptions)
      const result = signal(currentResult)

      cleanup()

      if (currentResult.fetchStatus === 'fetching' && !pendingTaskRef) {
        pendingTaskRef = pendingTasks.add()
      }

      const unsubscribe = isRestoring
        ? noop
        : ngZone.runOutsideAngular(() =>
            observer.subscribe(
              notifyManager.batchCalls((state) => {
                result.set(state)
                ngZone.run(() => {
                  if (state.fetchStatus === 'fetching' && !pendingTaskRef) {
                    pendingTaskRef = pendingTasks.add()
                  }

                  if (state.fetchStatus === 'idle' && pendingTaskRef) {
                    pendingTaskRef()
                    pendingTaskRef = null
                  }

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
                })
              }),
            ),
          )

      cleanup = () => {
        unsubscribe()
        if (pendingTaskRef) {
          pendingTaskRef()
          pendingTaskRef = null
        }
      }

      return result
    })
  })

  destroyRef.onDestroy(() => cleanup())

  /**
   * This effect is responsible for triggering
   * the query by listing to the result.
   *
   * If this effect was removed, queries would
   * be executed lazily on read.
   */
  effect(() => {
    linkedResultSignal()
  })

  return signalProxy(
    computed(() => {
      const result = linkedResultSignal()()

      // Wrap methods to ensure observer has latest options before execution
      const observer = observerSignal()

      const originalRefetch = result.refetch
      return {
        ...result,
        refetch: ((...args: Parameters<typeof originalRefetch>) => {
          observer.setOptions(defaultedOptionsSignal())
          return originalRefetch(...args)
        }) as typeof originalRefetch,
      }
    }),
  )
}
