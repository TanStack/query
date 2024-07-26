<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createMutation } from '../../src/createMutation.svelte'
  import { sleep } from '../utils.svelte.js'
  import { useIsMutating } from '../../src/useIsMutating.svelte'

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
    queryClient,
  )
</script>

<button onclick={() => mutation.mutate()}>Trigger</button>

<div>isMutating: {isMutating()}</div>
