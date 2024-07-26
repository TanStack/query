import { onDestroy } from 'svelte'

import { MutationObserver, notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'
import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
  FunctionedParams,
} from './types.js'

import type { DefaultError, QueryClient } from '@tanstack/query-core'

export function createMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: FunctionedParams<
    CreateMutationOptions<TData, TError, TVariables, TContext>
  >,
  queryClient?: QueryClient,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const client = useQueryClient(queryClient)

  const observer = $derived(
    new MutationObserver<TData, TError, TVariables, TContext>(
      client,
      options(),
    ),
  )

  const mutate = $state<
    CreateMutateFunction<TData, TError, TVariables, TContext>
  >((variables, mutateOptions) => {
    observer.mutate(variables, mutateOptions).catch(noop)
  })

  $effect.pre(() => {
    observer.setOptions(options())
  })

  const result = $state(observer.getCurrentResult())

  const unsubscribe = observer.subscribe((val) => {
    notifyManager.batchCalls(() => {
      Object.assign(result, val)
    })()
  })

  onDestroy(() => {
    unsubscribe()
  })

  // @ts-expect-error
  return new Proxy(result, {
    get: (_, prop) => {
      const r = {
        ...result,
        mutate,
        mutateAsync: result.mutate,
      }
      if (prop == 'value') return r
      // @ts-expect-error
      return r[prop]
    },
  })
}

function noop() {}
