<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'

  let {
    mutationFn,
  }: { mutationFn: (value: { count: number }) => Promise<{ count: number }> } =
    $props()

  let count = $state(0)

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({ mutationFn: mutationFn }))
</script>

<button onclick={() => mutation.mutate({ count: ++count })}>Mutate</button>

<div>Data: {mutation.data?.count ?? 'undefined'}</div>
<div>Status: {mutation.status}</div>
<div>Failure Count: {mutation.failureCount}</div>
<div>Failure Reason: {mutation.failureReason ?? 'undefined'}</div>
