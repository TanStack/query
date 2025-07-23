<script lang="ts">
  import { writable } from 'svelte/store'
  import { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  export let onSuccessMock: any
  export let onSettledMock: any

  const count = writable(0)

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation({
    mutationFn: (vars: { count: number }) => sleep(10).then(() => vars.count),
    onSuccess: (data) => {
      onSuccessMock(data)
    },
    onSettled: (data) => {
      onSettledMock(data)
    },
  })
</script>

<button on:click={() => $mutation.mutate({ count: ++$count })}>Mutate</button>

<div>Count: {$count}</div>
