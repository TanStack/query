<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../../src/context'
  import { createMutation } from '../../src/createMutation.svelte'
  import { useMutationState } from '../../src/useMutationState.svelte'
  import type {
    CreateMutationOptions,
    MutationStateOptions,
  } from '../src/types'

  let {
    successMutationOpts,
    errorMutationOpts,
    mutationStateOpts,
  }: {
    successMutationOpts: CreateMutationOptions
    errorMutationOpts: CreateMutationOptions
    mutationStateOpts: MutationStateOptions | undefined
  } = $props()

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const successMutation = createMutation(successMutationOpts)
  const errorMutation = createMutation(errorMutationOpts)

  const mutationState = useMutationState(mutationStateOpts)
  let statuses = $derived(mutationState.map((state) => state.status))
</script>

<div data-testid="result">
  {JSON.stringify(statuses)}
</div>

<button data-testid="success" on:click={() => successMutation.mutate()}>
  Click
</button>
<button data-testid="error" on:click={() => errorMutation.mutate()}>
  Click
</button>
