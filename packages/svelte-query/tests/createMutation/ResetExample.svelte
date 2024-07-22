<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../../src/context'
  import { createMutation } from '../../src/createMutation'

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation({
    mutationFn: () => {
      const err = new Error('Expected mock error')
      err.stack = ''
      return Promise.reject(err)
    },
  })
</script>

<button on:click={() => $mutation.reset()}>Reset</button>
<button on:click={() => $mutation.mutate()}>Mutate</button>

<div>Error: {$mutation.error?.message}</div>
