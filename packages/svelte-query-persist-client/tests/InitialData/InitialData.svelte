<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils.svelte.js'
  import type { StatelessRef, StatusResult } from '../utils.svelte.js'

  let { states }: { states: StatelessRef<Array<StatusResult<string>>> } =
    $props()

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await sleep(5)
      return 'fetched'
    },

    initialData: 'initial',
    // make sure that initial data is older than the hydration data
    // otherwise initialData would be newer and takes precedence
    initialDataUpdatedAt: 1,
  }))

  $effect(() => {
    // svelte-ignore state_snapshot_uncloneable
    const snapshot = $state.snapshot(query)
    states.current.push(snapshot)
  })
</script>

<div>{query.data}</div>
<div>fetchStatus: {query.fetchStatus}</div>
