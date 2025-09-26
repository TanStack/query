<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import {
    createMutation,
    setQueryClientContext,
    useMutationState,
  } from '../../src/index.js'
  import type {
    CreateMutationOptions,
    MutationStateOptions,
  } from '../../src/types.js'

  export let successMutationOpts: CreateMutationOptions
  export let errorMutationOpts: CreateMutationOptions
  export let mutationStateOpts: MutationStateOptions | undefined = undefined

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const successMutation = createMutation(successMutationOpts)
  const errorMutation = createMutation(errorMutationOpts)

  const mutationState = useMutationState(mutationStateOpts)
</script>

<button on:click={() => $successMutation.mutate()}>Success</button>
<button on:click={() => $errorMutation.mutate()}>Error</button>

<div>
  Data: {JSON.stringify($mutationState.map((state) => state.status))}
</div>
