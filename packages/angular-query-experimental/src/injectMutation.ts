import {
  DestroyRef,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core'
import { MutationObserver, notifyManager } from '@tanstack/query-core'
import { assertInjector } from 'ngxtension/assert-injector'
import { injectQuery } from './injectQuery'
import { QUERY_CLIENT } from './injectQueryClient'
import type { DefaultError } from '@tanstack/query-core'
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
  options: () => CreateMutationOptions<TData, TError, TVariables, TContext>,
  injector?: Injector,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  injector = assertInjector(injectQuery, injector)
  return runInInjectionContext(injector, () => {
    const queryClient = inject(QUERY_CLIENT)

    const observer = new MutationObserver<TData, TError, TVariables, TContext>(
      queryClient,
      options(),
    )
    const mutate: CreateMutateFunction<TData, TError, TVariables, TContext> = (
      variables,
      mutateOptions,
    ) => {
      observer.mutate(variables, mutateOptions).catch(noop)
    }

    effect(() => {
      observer.setOptions(options())
    })

    const result = signal(observer.getCurrentResult())
    const unsubscribe = observer.subscribe(
      notifyManager.batchCalls((val) => {
        result.set(val)
      }),
    )
    const destroyRef = inject(DestroyRef)
    destroyRef.onDestroy(unsubscribe)

    return computed(() => ({
      ...result(),
      mutate,
      mutateAsync: result().mutate,
    }))
  })
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
