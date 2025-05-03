import { MutationObserver } from '@tanstack/query-core'
import { untrack } from 'svelte'
import { useQueryClient } from './useQueryClient.js'
import { createRawRef } from './containers.svelte.js'
import type {
  Accessor,
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
  options: Accessor<CreateMutationOptions<TData, TError, TVariables, TContext>>,
  queryClientOption?: Accessor<QueryClient>,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const queryClient = $derived(queryClientOption?.())
  const client = $derived(useQueryClient(queryClient))

  const observer = $derived(
    new MutationObserver<TData, TError, TVariables, TContext>(
      client,
      untrack(() => options()),
    ),
  )

  const mutate = $state<
    CreateMutateFunction<TData, TError, TVariables, TContext>
  >((variables, mutateOptions) => {
    observer.mutate(variables, mutateOptions).catch(noop)
  })

  function createResult() {
    const result = observer.getCurrentResult()
    return {
      ...result,
      mutateAsync: result.mutate,
      mutate,
    }
  }

  // svelte-ignore state_referenced_locally
  const [mutation, update] = createRawRef(createResult())

  $effect(() => update(createResult()))
  $effect.pre(() => {
    observer.setOptions(options())
  })
  return mutation
}

function noop() {}
