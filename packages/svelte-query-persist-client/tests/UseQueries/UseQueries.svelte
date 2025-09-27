<script lang="ts">
  import { createQueries } from '@tanstack/svelte-query'
  import type { StatelessRef, StatusResult } from '../utils.svelte.js'

  let { states }: { states: StatelessRef<Array<StatusResult<string>>> } =
    $props()

  const queries = createQueries(() => ({
    queries: [
      {
        queryKey: ['test'],
        queryFn: () => Promise.resolve('fetched'),
      },
    ],
  }))

  $effect(() => {
    // svelte-ignore state_snapshot_uncloneable
    const snapshot = $state.snapshot(queries[0])
    states.current.push(snapshot)
  })
</script>

<div>{queries[0].data}</div>
<div>fetchStatus: {queries[0].fetchStatus}</div>
