<script lang="ts">
  import { untrack } from 'svelte'
  import { createQuery, keepPreviousData } from '../../src/index.js'
  import { sleep } from '../utils.svelte.js'
  import type { QueryClient, QueryObserverResult } from '@tanstack/query-core'

  let {
    queryClient,
    states,
  }: {
    queryClient: QueryClient
    states: { value: Array<QueryObserverResult> }
  } = $props()

  let count = $state(0)

  const query = createQuery(
    () => ({
      queryKey: ['test', count],
      queryFn: async () => {
        await sleep(5)
        return count
      },
      placeholderData: keepPreviousData,
    }),
    queryClient,
  )

  $effect(() => {
    // @ts-expect-error
    // svelte-ignore state_snapshot_uncloneable
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<button onclick={() => (count += 1)}>setCount</button>

<div>Status: {query.status}</div>
<div>Data: {query.data ?? 'undefined'}</div>
