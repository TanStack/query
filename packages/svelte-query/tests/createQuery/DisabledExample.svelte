<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { derived, writable } from 'svelte/store'
  import { createQuery } from '../../src/createQuery'
  import { queryKey, sleep } from '../utils'

  const queryClient = new QueryClient()
  const key = queryKey()
  const count = writable(0)

  const options = derived(count, ($count) => ({
    queryKey: [key, $count],
    queryFn: async () => {
      await sleep(5)
      return $count
    },
    enabled: $count === 0,
  }))

  const query = createQuery(options, queryClient)
</script>

<button on:click={() => ($count += 1)}>Increment</button>
<div>Data: {$query.data ?? 'undefined'}</div>
<div>Count: {$count}</div>
