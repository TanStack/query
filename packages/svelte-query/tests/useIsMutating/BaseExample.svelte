<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createMutation, useIsMutating } from '../../src/index.js'
  import { sleep } from '../utils.svelte.js'

  const queryClient = new QueryClient()
  const isMutating = useIsMutating(undefined, queryClient)

  const mutation = createMutation(
    () => ({
      mutationKey: ['mutation-1'],
      mutationFn: async () => {
        await sleep(5)
        return 'data'
      },
    }),
    () => queryClient,
  )
</script>

<button onclick={() => mutation.mutate()}>Trigger</button>

<div>isMutating: {isMutating.current}</div>
