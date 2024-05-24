<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../context'
  import { createMutation } from '../createMutation'
  import { createMutationState } from '../createMutationState'

  import type { CreateMutationOptions, MutationStateOptions } from '../types'

  export let successMutationOpts: CreateMutationOptions
  export let errorMutationOpts: CreateMutationOptions
  export let mutationStateOpts: MutationStateOptions | undefined = undefined

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const successMutation = createMutation(successMutationOpts)
  const errorMutation = createMutation(errorMutationOpts)

  const mutationState = createMutationState(mutationStateOpts)
  $: statuses = $mutationState.map((state) => state.status)
</script>

<div data-testid="result">
  {JSON.stringify(statuses)}
</div>

<button data-testid="success" on:click={() => $successMutation.mutate()}>
  Click
</button>
<button data-testid="error" on:click={() => $errorMutation.mutate()}>
  Click
</button>
