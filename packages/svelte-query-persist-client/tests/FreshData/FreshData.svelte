<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import type { StatelessRef, StatusResult } from '../utils.svelte.js'

  let {
    states,
  }: {
    states: StatelessRef<Array<StatusResult<string>>>
  } = $props()

  const query = createQuery(() => ({
    queryKey: ['test'],
    // queryFn is provided by queryClient.setQueryDefaults in test
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
