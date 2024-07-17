<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createQuery } from '../../src/index'
  import { queryKey, sleep } from '../utils'

  const queryClient = new QueryClient()
  const key = queryKey()
  let count = $state(-1)

  const options = $derived({
    queryKey: () => [key, count],
    queryFn: async () => {
      console.log('enabled')
      await sleep(5)
      return count
    },
    enabled: () => count === 0,
  })

  const query = createQuery(() => options, queryClient)
</script>

<button onclick={() => (count += 1)}>Increment</button>
<div>Data: {query.data ?? 'undefined'}</div>
<div>Count: {count}</div>
