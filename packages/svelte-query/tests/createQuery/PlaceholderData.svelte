<script lang="ts">
  import { derived, writable } from 'svelte/store'
  import { createQuery, keepPreviousData } from '../../src/index'
  import { sleep } from '../utils'
  import type { QueryClient } from '@tanstack/query-core'
  import type { Writable } from 'svelte/store'

  export let queryClient: QueryClient
  export let states: Writable<Array<any>>

  const count = writable(0)

  const options = derived(count, ($count) => ({
    queryKey: ['test', $count],
    queryFn: async () => {
      await sleep(10)
      return $count
    },
    placeholderData: keepPreviousData,
  }))

  const query = createQuery(options, queryClient)

  $: states.update((prev) => [...prev, $query])
</script>

<button on:click={() => ($count += 1)}>setCount</button>

<div>Status: {$query.status}</div>
<div>Data: {$query.data}</div>
