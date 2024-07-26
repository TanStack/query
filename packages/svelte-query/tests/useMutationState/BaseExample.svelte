<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../../src/index.js'
  import { createMutation } from '../../src/createMutation.svelte'
  import { useMutationState } from '../../src/useMutationState.svelte'
  import type {
    CreateMutationOptions,
    FunctionedParams,
    MutationStateOptions,
  } from '../../src/index.js'

  let {
    successMutationOpts,
    errorMutationOpts,
    mutationStateOpts,
  }: {
    successMutationOpts: FunctionedParams<CreateMutationOptions>
    errorMutationOpts: FunctionedParams<CreateMutationOptions>
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
