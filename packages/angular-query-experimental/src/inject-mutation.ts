import { DestroyRef, computed, effect, inject, signal } from '@angular/core'
import { MutationObserver, notifyManager } from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import { signalProxy } from './signal-proxy'
import { injectQueryClient } from './inject-query-client'
import type { DefaultError, QueryClient } from '@tanstack/query-core'
import type { Injector } from '@angular/core'

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
    const destroyRef = inject(DestroyRef)

    const observer = new MutationObserver<TData, TError, TVariables, TContext>(
      queryClient,
      options(queryClient),
    )
    const mutate: CreateMutateFunction<TData, TError, TVariables, TContext> = (
      variables,
      mutateOptions,
    ) => {
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
  })
}

function noop() {}
