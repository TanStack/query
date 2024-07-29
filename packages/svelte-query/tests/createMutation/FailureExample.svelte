<script lang="ts">
  import { writable } from 'svelte/store'
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../../src/context'
  import { createMutation } from '../../src/createMutation'

  export let mutationFn: (value: {
    count: number
  }) => Promise<{ count: number }>

  const count = writable(0)

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation({ mutationFn: mutationFn })
</script>

<button on:click={() => $mutation.mutate({ count: ++$count })}>Mutate</button>

<div>Data: {$mutation.data?.count}</div>
<div>Status: {$mutation.status}</div>
<div>Failure Count: {$mutation.failureCount}</div>
<div>Failure Reason: {$mutation.failureReason}</div>
