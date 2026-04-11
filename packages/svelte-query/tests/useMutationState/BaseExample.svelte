<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
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
    queryClient,
    successMutationOpts,
    errorMutationOpts,
    mutationStateOpts,
  }: {
    queryClient: QueryClient
    successMutationOpts: Accessor<CreateMutationOptions>
    errorMutationOpts: Accessor<CreateMutationOptions>
    mutationStateOpts?: MutationStateOptions | undefined
  } = $props()

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
