import {
  DestroyRef,
  Injector,
  NgZone,
  assertInInjectionContext,
  computed,
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
import type { DefaultError } from '@tanstack/query-core'
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
  const destroyRef = injector.get(DestroyRef)
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
      const observerOptions = optionsSignal()
      return untracked(() => {
        if (instance) {
          instance.setOptions(observerOptions)
        } else {
          instance = new MutationObserver(queryClient, observerOptions)
        }
        return instance
      })
    })
  })()

  const mutateFnSignal = computed<
    CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>
  >(() => {
    const observer = observerSignal()
    return (variables, mutateOptions) => {
      void observer.mutate(variables, mutateOptions).catch(noop)
    }
  })

  let cleanup: () => void = noop

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

    return untracked(() => {
      // observer.trackResult is not used as this optimization is not needed for Angular
      const currentResult = observer.getCurrentResult()
      const result = signal(currentResult)

      cleanup()
      let pendingTaskRef = currentResult.isPending ? pendingTasks.add() : null

      const unsubscribe = ngZone.runOutsideAngular(() =>
        observer.subscribe(
          notifyManager.batchCalls((state) => {
            ngZone.run(() => {
              result.set(state)

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
            })
          }),
        ),
      )

      cleanup = () => {
        // Clean up any pending task on destroy
        if (pendingTaskRef) {
          pendingTaskRef()
          pendingTaskRef = null
        }
        unsubscribe()
      }

      return result
    })
  })

  const resultSignal = computed(() => {
    const result = linkedResultSignal()()

    return {
      ...result,
      mutate: mutateFnSignal(),
      mutateAsync: result.mutate,
    }
  })

  destroyRef.onDestroy(() => cleanup())

  return signalProxy(resultSignal) as CreateMutationResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
}
