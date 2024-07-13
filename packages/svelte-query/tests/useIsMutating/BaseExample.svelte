<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createMutation } from '../../src/createMutation'
  import { sleep } from '../utils'
  import { useIsMutating } from '../../src/useIsMutating.svelte'

  const queryClient = new QueryClient()
  const isMutating = useIsMutating(undefined, queryClient)

  const mutation = createMutation(
    {
      mutationKey: ['mutation1'],
      mutationFn: async () => {
        await sleep(20)
        return 'data'
      },
    },
    queryClient,
  )
</script>

<button on:click={() => $mutation.mutate()}>Trigger</button>

<div>isMutating: {$isMutating}</div>
