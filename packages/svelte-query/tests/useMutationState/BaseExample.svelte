<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import {
    createMutation,
    setQueryClientContext,
    useMutationState,
  } from '../../src/index.js'
  import type {
    Accessor,
    CreateMutationOptions,
    MutationStateOptions,
  } from '../../src/index.js'

  let {
    successMutationOpts,
    errorMutationOpts,
    mutationStateOpts,
  }: {
    successMutationOpts: Accessor<CreateMutationOptions>
    errorMutationOpts: Accessor<CreateMutationOptions>
    mutationStateOpts?: MutationStateOptions | undefined
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

<button data-testid="success" onclick={() => successMutation.mutate()}>
  Click
</button>
<button data-testid="error" onclick={() => errorMutation.mutate()}>
  Click
</button>
