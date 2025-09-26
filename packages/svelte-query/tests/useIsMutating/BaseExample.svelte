<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createMutation, useIsMutating } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  const queryClient = new QueryClient()
  const isMutating = useIsMutating(undefined, queryClient)

  const mutation = createMutation(
    {
      mutationKey: ['mutation-1'],
      mutationFn: () => sleep(10).then(() => 'data'),
    },
    queryClient,
  )
</script>

<button on:click={() => $mutation.mutate()}>Trigger</button>

<div>isMutating: {$isMutating}</div>
