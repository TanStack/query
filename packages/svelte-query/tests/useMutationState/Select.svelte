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
    mutationOpts: Accessor<CreateMutationOptions<string>>
    mutationStateOpts: MutationStateOptions<string>
  }

  let { queryClient, mutationOpts, mutationStateOpts }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation = createMutation(mutationOpts)

  const variables = useMutationState(mutationStateOpts)
</script>

<button onclick={() => mutation.mutate()}>mutate</button>

<div>
  Variables: {JSON.stringify(variables)}
</div>
