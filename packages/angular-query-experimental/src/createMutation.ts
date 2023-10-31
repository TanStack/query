import {
  DestroyRef,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core'
import { MutationObserver, notifyManager } from '@tanstack/query-core'
import { QueryClientService } from './QueryClientService'
import type { DefaultError, QueryClient } from '@tanstack/query-core'

import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types'

export function createMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: () => CreateMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: QueryClient,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  assertInInjectionContext(createMutation)
  if (!queryClient) {
    queryClient = inject(QueryClientService).useQueryClient()
  }

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
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
