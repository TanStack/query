<script lang="ts">
  import { untrack } from 'svelte'
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils.svelte'
  import type { StatusResult } from '../utils.svelte'

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
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<div>data: {query.data ?? 'undefined'}</div>
<div>fetchStatus: {query.fetchStatus}</div>
