import {
  DestroyRef,
  Injector,
  NgZone,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core'
import {
  MutationObserver,
  QueryClient,
  notifyManager,
} from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import { signalProxy } from './signal-proxy'
import { noop, shouldThrowError } from './util'

import { lazyInit } from './util/lazy-init/lazy-init'
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
    const currentInjector = inject(Injector)
    const destroyRef = inject(DestroyRef)
    const ngZone = inject(NgZone)
    const queryClient = inject(QueryClient)

    return lazyInit(() =>
      runInInjectionContext(currentInjector, () => {
        const observer = new MutationObserver<
          TData,
          TError,
          TVariables,
          TContext
        >(queryClient, optionsFn())
        const mutate: CreateMutateFunction<
          TData,
          TError,
          TVariables,
          TContext
        > = (variables, mutateOptions) => {
          observer.mutate(variables, mutateOptions).catch(noop)
        }

        effect(() => {
          observer.setOptions(
            runInInjectionContext(currentInjector, () => optionsFn()),
          )
        })

        const result = signal(observer.getCurrentResult())

        const unsubscribe = ngZone.runOutsideAngular(() =>
          observer.subscribe(
            notifyManager.batchCalls(
              (
                state: MutationObserverResult<
                  TData,
                  TError,
                  TVariables,
                  TContext
                >,
              ) => {
                ngZone.run(() => {
                  if (
                    state.isError &&
                    shouldThrowError(observer.options.throwOnError, [
                      state.error,
                    ])
                  ) {
                    throw state.error
                  }
                  result.set(state)
                })
              },
            ),
          ),
        )

        destroyRef.onDestroy(unsubscribe)

        const resultSignal = computed(() => ({
          ...result(),
          mutate,
          mutateAsync: result().mutate,
        }))

        return signalProxy(resultSignal) as unknown as CreateMutationResult<
          TData,
          TError,
          TVariables,
          TContext
        >
      }),
    )
  })
}
