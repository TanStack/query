<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '@tanstack/query-test-utils'
  import type { StatelessRef, StatusResult } from '../utils.svelte.js'

  let {
    states,
    onFetch,
  }: {
    states: StatelessRef<Array<StatusResult<string>>>
    onFetch: () => void
  } = $props()

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await sleep(10)
      onFetch()
      return 'fetched'
    },
    staleTime: Infinity,
  }))

  $effect(() => {
    // svelte-ignore state_snapshot_uncloneable
    const snapshot = $state.snapshot(query)
    states.current.push(snapshot)
  })
</script>

<div>data: {query.data ?? 'null'}</div>
<div>fetchStatus: {query.fetchStatus}</div>
