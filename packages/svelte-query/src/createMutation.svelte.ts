import { MutationObserver } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'
import { createRawRef } from './containers.svelte.js'
import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types.js'

import type { DefaultError, QueryClient } from '@tanstack/query-core'

export function createMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: CreateMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: QueryClient,
): () => CreateMutationResult<TData, TError, TVariables, TContext> {
  const client = useQueryClient(queryClient)

  const observer = new MutationObserver<TData, TError, TVariables, TContext>(
    client,
    options,
  )

  const mutate = $state<
    CreateMutateFunction<TData, TError, TVariables, TContext>
  >((variables, mutateOptions) => {
    observer.mutate(variables, mutateOptions).catch(noop)
  })

  function createResult() {
    const result = observer.getCurrentResult()
    Object.defineProperty(result, 'mutateAsync', {
      value: result.mutate,
    })
    Object.defineProperty(result, 'mutate', {
      value: mutate,
    })
    return result
  }

  const [mutation, update] = createRawRef(createResult())

  $effect(() => update(createResult()))

  // @ts-expect-error
  return mutation
}

function noop() {}
