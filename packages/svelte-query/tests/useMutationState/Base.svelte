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

  type Props = {
    queryClient: QueryClient
    successMutationOpts: Accessor<CreateMutationOptions<string>>
    errorMutationOpts: Accessor<CreateMutationOptions<string>>
    mutationStateOpts?: MutationStateOptions
  }

  let {
    queryClient,
    successMutationOpts,
    errorMutationOpts,
    mutationStateOpts,
  }: Props = $props()

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
