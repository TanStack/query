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
</script>

<button onclick={() => successMutation.mutate()}>Success</button>
<button onclick={() => errorMutation.mutate()}>Error</button>

<div>
  Data: {JSON.stringify(mutationState.map((state) => state.status))}
</div>
