import { computed, effect, inject, untracked } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import { injectIsRestoring } from './inject-is-restoring'
import { injectExternalStore } from './utils/inject-external-store'
import { injectPendingTasksLifecycle } from './utils/inject-pending-tasks-lifecycle'
import { injectQueryZone } from './utils/inject-query-zone'
import type {
  QueryKey,
  QueryObserver,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'

/**
 * Base implementation for `injectQuery` and `injectInfiniteQuery`.
 * @param optionsFn - Produces the reactive query options.
 * @param Observer - The core observer constructor for this query kind.
 * @returns The current result signal and a function that reads its active observer.
 */
export function injectBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  optionsFn: () => QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
) {
  const outsideZone = injectQueryZone()
  const queryClient = inject(QueryClient)
  const isRestoring = injectIsRestoring()
  const lifecycle = injectPendingTasksLifecycle()

  const shouldBlockPendingTasks = (
    observer: QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
    result: QueryObserverResult<TData, TError>,
  ) => {
    return (
      observer.getCurrentQuery().state.fetchStatus !== 'idle' ||
      (result.fetchStatus !== 'idle' && result.isEnabled)
    )
  }

  const defaultedOptionsSignal = computed(() => {
    const defaultedOptions = queryClient.defaultQueryOptions(optionsFn())
    defaultedOptions._optimisticResults = isRestoring()
      ? 'isRestoring'
      : 'optimistic'
    defaultedOptions.notifyOnChangeProps = 'all'
    return defaultedOptions
  })

  const observerSignal = computed(
    () => new Observer(queryClient, untracked(defaultedOptionsSignal)),
  )

  const readerSignal = computed(() =>
    observerSignal().createResultReader(defaultedOptionsSignal()),
  )

  effect(() => {
    const reader = readerSignal()
    outsideZone(() => untracked(reader.commit))
  })

  const resultSignal = injectExternalStore(() => {
    const observer = observerSignal()
    const restoring = isRestoring()
    return {
      getSnapshot: () => readerSignal().getSnapshot(),
      subscribe: restoring
        ? undefined
        : (onStoreChange) => {
            const unsubscribe = observer.subscribe(() => {
              if (lifecycle.destroyed) return
              onStoreChange()
            })
            observer.updateResult()
            return () => {
              lifecycle.setPending(false)
              unsubscribe()
            }
          },
    }
  })

  effect((onCleanup) => {
    const result = resultSignal()
    if (isRestoring()) {
      lifecycle.setPending(false)
      return
    }

    lifecycle.setPending(shouldBlockPendingTasks(observerSignal(), result))
    onCleanup(() => lifecycle.setPending(false))
  })

  // Imperative methods use current options before starting work, even when
  // invoked before the subscription effect runs.
  const getObserver = () =>
    untracked(() => {
      const observer = observerSignal()
      readerSignal().commit()
      return observer
    })

  return [resultSignal, getObserver] as const
}
