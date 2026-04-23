<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'

  type Props = {
    queryClient: QueryClient
    mutationFn: (value: { count: number }) => Promise<{ count: number }>
  }

  let { queryClient, mutationFn }: Props = $props()

  let count = $state(0)

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({ mutationFn }))
</script>

<button onclick={() => mutation.mutate({ count: ++count })}>Mutate</button>

<div>Data: {mutation.data?.count ?? 'undefined'}</div>
<div>Status: {mutation.status}</div>
<div>Failure Count: {mutation.failureCount}</div>
<div>Failure Reason: {mutation.failureReason ?? 'undefined'}</div>
