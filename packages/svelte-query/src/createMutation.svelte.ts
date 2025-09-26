import { onDestroy } from 'svelte'

import { MutationObserver, noop, notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'
import type {
  Accessor,
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types.js'

import type { DefaultError, QueryClient } from '@tanstack/query-core'

/**
 * @param options - A function that returns mutation options
 * @param queryClient - Custom query client which overrides provider
 */
export function createMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: Accessor<CreateMutationOptions<TData, TError, TVariables, TContext>>,
  queryClient?: Accessor<QueryClient>,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const client = useQueryClient(queryClient?.())

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

  let result = $state(() => observer.getCurrentResult())

  const unsubscribe = observer.subscribe((val) => {
    notifyManager.batchCalls(() => {
      result = () => val
    })()
  })

  onDestroy(() => {
    unsubscribe()
  })

  // @ts-expect-error
  return new Proxy(() => result(), {
    get: (_, prop) => {
      const r = {
        ...result(),
        mutate,
        mutateAsync: result().mutate,
      }
      if (prop == 'value') return r
      // @ts-expect-error
      return r[prop]
    },
  })
}
