<script lang="ts">
  import { writable } from 'svelte/store'
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../../src/context'
  import { createMutation } from '../../src/createMutation'

  export let onSuccessMock: any
  export let onSettledMock: any

  const count = writable(0)

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation({
    mutationFn: (vars: { count: number }) => Promise.resolve(vars.count),
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
