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
  MutationObserver,
  QueryClient,
  notifyManager,
} from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import { signalProxy } from './signal-proxy'
import { noop, shouldThrowError } from './util'
import type { Injector } from '@angular/core'
import type { DefaultError, MutationObserverResult } from '@tanstack/query-core'
import type { CreateMutateFunction, CreateMutationResult } from './types'
import type { CreateMutationOptions } from './mutation-options'

/**
 * Injects a mutation: an imperative function that can be invoked which typically performs server side effects.
 *
 * Unlike queries, mutations are not run automatically.
 * @param optionsFn - A function that returns mutation options.
 * @param injector - The Angular injector to use.
 * @returns The mutation.
 * @public
 */
export function injectMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  optionsFn: () => CreateMutationOptions<TData, TError, TVariables, TContext>,
  injector?: Injector,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  return assertInjector(injectMutation, injector, () => {
    const destroyRef = inject(DestroyRef)
    const ngZone = inject(NgZone)
    const queryClient = inject(QueryClient)

    /**
     * computed() is used so signals can be inserted into the options
     * making it reactive. Wrapping options in a function ensures embedded expressions
     * are preserved and can keep being applied after signal changes
     */
    const optionsSignal = computed(optionsFn)

    const observerSignal = (() => {
      let instance: MutationObserver<
        TData,
        TError,
        TVariables,
        TContext
      > | null = null

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
        const options = optionsSignal()

        untracked(() => {
          observer.setOptions(options)
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
                    shouldThrowError(observer.options.throwOnError, [
                      state.error,
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
  })
}
