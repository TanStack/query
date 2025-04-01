<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'

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

<div>Error: {$mutation.error?.message ?? 'undefined'}</div>
