<script lang="ts">
  import { createQuery, keepPreviousData } from '../../src/index'
  import { sleep } from '../utils'
  import type { QueryClient, QueryObserverResult } from '@tanstack/query-core'

  let { queryClient, states } = $props<{
    queryClient: QueryClient
    states: Array<QueryObserverResult>
  }>()

  let count = $state(0)

  const options = $derived(() => ({
    queryKey: ['test', count],
    queryFn: async () => {
      await sleep(10)
      return count
    },
    placeholderData: keepPreviousData,
  }))

  const query = createQuery(options, queryClient)

  $effect(() => {
    states = [...states, query]
  })
</script>

<button onclick={() => (count += 1)}>setCount</button>

<div>Status: {query.status}</div>
<div>Data: {query.data}</div>
