<script lang="ts">
  import { derived, writable } from 'svelte/store'
  import { createQuery, keepPreviousData } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'
  import type { QueryClient, QueryObserverResult } from '@tanstack/query-core'
  import type { Writable } from 'svelte/store'

  export let queryClient: QueryClient
  export let states: Writable<Array<QueryObserverResult>>

  const count = writable(0)

  const options = derived(count, ($count) => ({
    queryKey: ['test', $count],
    queryFn: () => sleep(10).then(() => $count),
    placeholderData: keepPreviousData,
  }))

  const query = createQuery(options, queryClient)

  $: states.update((prev) => [...prev, $query])
</script>

<button on:click={() => ($count += 1)}>setCount</button>

<div>Status: {$query.status}</div>
<div>Data: {$query.data ?? 'undefined'}</div>
