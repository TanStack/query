<script lang="ts">
  import { untrack } from 'svelte'
  import { createQueries } from '@tanstack/svelte-query'
  import { sleep } from '../utils.svelte.js'
  import type { StatusResult } from '../utils.svelte.js'

  let { states }: { states: { value: Array<StatusResult<string>> } } = $props()

  const queries = createQueries({
    queries: () => [
      {
        queryKey: ['test'],
        queryFn: async (): Promise<string> => {
          await sleep(5)
          return 'fetched'
        },
      },
    ],
  })

  $effect(() => {
    // svelte-ignore state_snapshot_uncloneable
    states.value = [...untrack(() => states.value), $state.snapshot(queries[0])]
  })
</script>

<div>{queries[0].data}</div>
<div>fetchStatus: {queries[0].fetchStatus}</div>
