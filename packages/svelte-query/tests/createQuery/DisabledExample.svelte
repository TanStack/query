<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { derived, writable } from 'svelte/store'
  import { createQuery } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'
  import type { QueryObserverResult } from '@tanstack/query-core'
  import type { Writable } from 'svelte/store'

  export let states: Writable<Array<QueryObserverResult>>

  const queryClient = new QueryClient()
  const count = writable(0)

  const options = derived(count, ($count) => ({
    queryKey: ['test', $count],
    queryFn: async () => {
      await sleep(5)
      return $count
    },
    enabled: $count === 0,
  }))

  const query = createQuery(options, queryClient)

  $: states.update((prev) => [...prev, $query])
</script>

<button on:click={() => ($count += 1)}>Increment</button>

<div>Data: {$query.data ?? 'undefined'}</div>
<div>Count: {$count}</div>
