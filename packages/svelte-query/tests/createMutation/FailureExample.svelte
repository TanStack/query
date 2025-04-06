<script lang="ts">
  import { writable } from 'svelte/store'
  import { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'

  export let mutationFn: (value: {
    count: number
  }) => Promise<{ count: number }>

  const count = writable(0)

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation({ mutationFn: mutationFn })
</script>

<button on:click={() => $mutation.mutate({ count: ++$count })}>Mutate</button>

<div>Data: {$mutation.data?.count ?? 'undefined'}</div>
<div>Status: {$mutation.status}</div>
<div>Failure Count: {$mutation.failureCount ?? 'undefined'}</div>
<div>Failure Reason: {$mutation.failureReason ?? 'null'}</div>
