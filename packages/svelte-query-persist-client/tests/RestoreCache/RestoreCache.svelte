<script lang="ts">
  import { untrack } from 'svelte'
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils.svelte.js'
  import type { StatusResult } from '../utils.svelte.js'

  let { states }: { states: { value: Array<StatusResult<string>> } } = $props()

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await sleep(5)
      return 'fetched'
    },
  }))

  $effect(() => {
    // svelte-ignore state_snapshot_uncloneable
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<div>{query.data}</div>
<div>fetchStatus: {query.fetchStatus}</div>
