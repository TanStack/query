<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { queryKey, sleep } from '@tanstack/query-test-utils'
  import { setQueryClientContext } from '../../src/context.js'
  import { createMutation, useIsMutating } from '../../src/index.js'

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationKey: queryKey(),
    mutationFn: () => sleep(10).then(() => 'data'),
  }))

  const isMutating = useIsMutating()
</script>

<button onclick={() => mutation.mutate()}>Trigger</button>

<div>isMutating: {isMutating.current}</div>
