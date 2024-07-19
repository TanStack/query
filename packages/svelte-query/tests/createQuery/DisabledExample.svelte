<script lang="ts">
  import { untrack } from 'svelte'
  import { QueryClient } from '@tanstack/query-core'
  import { createQuery } from '../../src/createQuery'
  import { sleep } from '../utils.svelte'
  import type { QueryObserverResult } from '@tanstack/query-core'

  let {
    states,
  }: {
    states: { value: Array<QueryObserverResult> }
  } = $props()

  const queryClient = new QueryClient()
  let count = $state(0)

  const options = $derived({
    queryKey: () => ['test', count],
    queryFn: async () => {
      await sleep(5)
      return count
    },
    enabled: () => count === 0,
  })

  const query = createQuery(options, queryClient)

  $effect(() => {
    states.value = [
      ...untrack(() => states.value),
      $state.snapshot(query) as QueryObserverResult,
    ]
  })
</script>

<button onclick={() => (count += 1)}>Increment</button>

<div>Data: {query.data ?? 'undefined'}</div>
<div>Count: {count}</div>
