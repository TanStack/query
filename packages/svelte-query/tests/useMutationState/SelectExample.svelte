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
    mutationOpts,
    mutationStateOpts,
  }: {
    mutationOpts: Accessor<CreateMutationOptions>
    mutationStateOpts: MutationStateOptions<any>
  } = $props()

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation(mutationOpts)

  const variables = useMutationState(mutationStateOpts)
</script>

<button onclick={() => mutation.mutate()}>mutate</button>

<div>
  Variables: {JSON.stringify(variables)}
</div>
