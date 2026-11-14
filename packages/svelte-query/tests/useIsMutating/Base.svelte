<script lang="ts">
  import { createKey, sleep } from '@tanstack/query-test-utils'
  import { setQueryClientContext } from '../../src/context.js'
  import { createMutation, useIsMutating } from '../../src/index.js'
  import type { QueryClient } from '@tanstack/query-core'

  type Props = {
    queryClient: QueryClient
  }

  let { queryClient }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationKey: createKey(),
    mutationFn: () => sleep(10).then(() => 'data'),
  }))

  const isMutating = useIsMutating()
</script>

<button onclick={() => mutation.mutate()}>Trigger</button>

<div>isMutating: {isMutating.current}</div>
