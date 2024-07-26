<script lang="ts">
  import { untrack } from 'svelte'
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils.svelte.js'
  import type { StatusResult } from '../utils.svelte.js'

  let {
    states,
    fetched,
  }: {
    states: { value: Array<StatusResult<string>> }
    fetched: boolean
  } = $props()

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      fetched = true
      await sleep(5)
      return 'fetched'
    },

    staleTime: Infinity,
  }))

  $effect(() => {
    // svelte-ignore state_snapshot_uncloneable
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<div>data: {query.data ?? 'undefined'}</div>
<div>fetchStatus: {query.fetchStatus}</div>
<div>fetched: {fetched}</div>
