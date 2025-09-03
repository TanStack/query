import {
  DestroyRef,
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
 * @public
 */
export function injectMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  injectMutationFn: () => CreateMutationOptions<
    TData,
    TError,
    TVariables,
    TContext
  >,
  options?: InjectMutationOptions,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  !options?.injector && assertInInjectionContext(injectMutation)
  const injector = options?.injector ?? inject(Injector)
  const destroyRef = injector.get(DestroyRef)
  const ngZone = injector.get(NgZone)
  const queryClient = injector.get(QueryClient)

  /**
   * computed() is used so signals can be inserted into the options
   * making it reactive. Wrapping options in a function ensures embedded expressions
   * are preserved and can keep being applied after signal changes
   */
  const optionsSignal = computed(injectMutationFn)

  const observerSignal = (() => {
    let instance: MutationObserver<TData, TError, TVariables, TContext> | null =
      null

    return computed(() => {
      return (instance ||= new MutationObserver(queryClient, optionsSignal()))
    })
  })()

  const mutateFnSignal = computed<
    CreateMutateFunction<TData, TError, TVariables, TContext>
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
    TContext
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
    () => {
      // observer.trackResult is not used as this optimization is not needed for Angular
      const observer = observerSignal()

      untracked(() => {
        const unsubscribe = ngZone.runOutsideAngular(() =>
          observer.subscribe(
            notifyManager.batchCalls((state) => {
              ngZone.run(() => {
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
        destroyRef.onDestroy(unsubscribe)
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

  return signalProxy(resultSignal) as CreateMutationResult<
    TData,
    TError,
    TVariables,
    TContext
  >
}
