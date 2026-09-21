<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  type Props = {
    queryClient: QueryClient
  }

  let { queryClient }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationFn: () =>
      sleep(10).then(() => Promise.reject(new Error('Expected mock error'))),
  }))
</script>

<button onclick={() => mutation.reset()}>Reset</button>
<button onclick={() => mutation.mutate()}>Mutate</button>

<div>Error: {mutation.error?.message ?? 'undefined'}</div>
