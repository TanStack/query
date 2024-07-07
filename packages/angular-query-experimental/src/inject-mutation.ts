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
import { MutationObserver, notifyManager } from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import { signalProxy } from './signal-proxy'
import { injectQueryClient } from './inject-query-client'
import { noop, shouldThrowError } from './util'

import { lazyInit } from './util/lazy-init/lazy-init'
import type {
  DefaultError,
  MutationObserverResult,
  QueryClient,
} from '@tanstack/query-core'
import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types'

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
  optionsFn: (
    client: QueryClient,
  ) => CreateMutationOptions<TData, TError, TVariables, TContext>,
  injector?: Injector,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  return assertInjector(injectMutation, injector, () => {
    const queryClient = injectQueryClient()
    const currentInjector = inject(Injector)
    const destroyRef = inject(DestroyRef)
    const ngZone = inject(NgZone)

    return lazyInit(() =>
      runInInjectionContext(currentInjector, () => {
        const observer = new MutationObserver<
          TData,
          TError,
          TVariables,
          TContext
        >(queryClient, optionsFn(queryClient))
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
            runInInjectionContext(currentInjector, () =>
              optionsFn(queryClient),
            ),
          )
        })

        const result = signal(observer.getCurrentResult())

        const unsubscribe = observer.subscribe(
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
                  shouldThrowError(observer.options.throwOnError, [state.error])
                ) {
                  throw state.error
                }
                result.set(state)
              })
            },
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
