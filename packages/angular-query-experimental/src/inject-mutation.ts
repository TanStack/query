import {
  DestroyRef,
  Injector,
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
import { noop } from './util'

import { lazyInit } from './util/lazy-init/lazy-init'
import type { DefaultError, QueryClient } from '@tanstack/query-core'
import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types'

export function injectMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: (
    client: QueryClient,
  ) => CreateMutationOptions<TData, TError, TVariables, TContext>,
  injector?: Injector,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  return assertInjector(injectMutation, injector, () => {
    const queryClient = injectQueryClient()
    const currentInjector = inject(Injector)
    const destroyRef = inject(DestroyRef)

    return lazyInit(() =>
      runInInjectionContext(currentInjector, () => {
        const observer = new MutationObserver<
          TData,
          TError,
          TVariables,
          TContext
        >(queryClient, options(queryClient))
        const mutate: CreateMutateFunction<
          TData,
          TError,
          TVariables,
          TContext
        > = (variables, mutateOptions) => {
          observer.mutate(variables, mutateOptions).catch(noop)
        }

        effect(() => {
          observer.setOptions(options(queryClient))
        })

        const result = signal(observer.getCurrentResult())

        const unsubscribe = observer.subscribe(
          notifyManager.batchCalls((val) => result.set(val)),
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
