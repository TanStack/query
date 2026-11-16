<script lang="ts">
  import { sleep } from '@tanstack/query-test-utils'
  import { createQuery } from '@tanstack/svelte-query'
  import type { StatelessRef, StatusResult } from '../utils.svelte.js'

  let { states }: { states: StatelessRef<Array<StatusResult<string>>> } =
    $props()

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: () => sleep(10).then(() => 'fetched'),
  }))

  $effect(() => {
    const snapshot = $state.snapshot(query)
    states.current.push(snapshot)
  })
</script>

<div>{query.data}</div>
<div>fetchStatus: {query.fetchStatus}</div>
