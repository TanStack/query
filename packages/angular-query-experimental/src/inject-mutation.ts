import {
  Injector,
  NgZone,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core'
import {
  MutationObserver,
  QueryClient,
  noop,
  notifyManager,
  shouldThrowError,
} from '@tanstack/query-core'
import { signalProxy } from './signal-proxy'
import { PENDING_TASKS } from './pending-tasks-compat'
import type { PendingTaskRef } from './pending-tasks-compat'
import type { DefaultError, MutationObserverResult } from '@tanstack/query-core'
import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types'

export interface InjectMutationOptions {
  /**
   * The `Injector` in which to create the mutation.
   *
   * If this is not provided, the current injection context will be used instead (via `inject`).
   */
  injector?: Injector
}

/**
 * Injects a mutation: an imperative function that can be invoked which typically performs server side effects.
 *
 * Unlike queries, mutations are not run automatically.
 * @param injectMutationFn - A function that returns mutation options.
 * @param options - Additional configuration
 * @returns The mutation.
 */
export function injectMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  injectMutationFn: () => CreateMutationOptions<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >,
  options?: InjectMutationOptions,
): CreateMutationResult<TData, TError, TVariables, TOnMutateResult> {
  !options?.injector && assertInInjectionContext(injectMutation)
  const injector = options?.injector ?? inject(Injector)
  const ngZone = injector.get(NgZone)
  const pendingTasks = injector.get(PENDING_TASKS)
  const queryClient = injector.get(QueryClient)

  /**
   * computed() is used so signals can be inserted into the options
   * making it reactive. Wrapping options in a function ensures embedded expressions
   * are preserved and can keep being applied after signal changes
   */
  const optionsSignal = computed(injectMutationFn)

  const observerSignal = (() => {
    let instance: MutationObserver<
      TData,
      TError,
      TVariables,
      TOnMutateResult
    > | null = null

    return computed(() => {
      return (instance ||= new MutationObserver(queryClient, optionsSignal()))
    })
  })()

  const mutateFnSignal = computed<
    CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>
  >(() => {
    const observer = observerSignal()
    return (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop)
    }
  })

  /**
   * Computed signal that gets result from mutation cache based on passed options
   */
  const resultFromInitialOptionsSignal = computed(() => {
    const observer = observerSignal()
    return observer.getCurrentResult()
  })

  /**
   * Signal that contains result set by subscriber
   */
  const resultFromSubscriberSignal = signal<MutationObserverResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > | null>(null)

  effect(
    () => {
      const observer = observerSignal()
      const observerOptions = optionsSignal()

      untracked(() => {
        observer.setOptions(observerOptions)
      })
    },
    {
      injector,
    },
  )

  effect(
    (onCleanup) => {
      const observer = observerSignal()
      let pendingTaskRef: PendingTaskRef | null = null

      untracked(() => {
        const unsubscribe = ngZone.runOutsideAngular(() =>
          observer.subscribe(
            notifyManager.batchCalls((state) => {
              ngZone.run(() => {
                // Track pending task when mutation is pending
                if (state.isPending && !pendingTaskRef) {
                  pendingTaskRef = pendingTasks.add()
                }

                // Clear pending task when mutation is no longer pending
                if (!state.isPending && pendingTaskRef) {
                  pendingTaskRef()
                  pendingTaskRef = null
                }

                if (
                  state.isError &&
                  shouldThrowError(observer.options.throwOnError, [state.error])
                ) {
                  ngZone.onError.emit(state.error)
                  throw state.error
                }

                resultFromSubscriberSignal.set(state)
              })
            }),
          ),
        )
        onCleanup(() => {
          // Clean up any pending task on destroy
          if (pendingTaskRef) {
            pendingTaskRef()
            pendingTaskRef = null
          }
          unsubscribe()
        })
      })
    },
    {
      injector,
    },
  )

  const resultSignal = computed(() => {
    const resultFromSubscriber = resultFromSubscriberSignal()
    const resultFromInitialOptions = resultFromInitialOptionsSignal()

    const result = resultFromSubscriber ?? resultFromInitialOptions

    return {
      ...result,
      mutate: mutateFnSignal(),
      mutateAsync: result.mutate,
    }
  })

  return signalProxy(resultSignal, [
    'mutate',
    'mutateAsync',
    'reset',
  ]) as CreateMutationResult<TData, TError, TVariables, TOnMutateResult>
}
