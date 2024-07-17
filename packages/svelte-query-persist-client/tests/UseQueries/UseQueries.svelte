<script lang="ts">
  import { untrack } from 'svelte'
  import { createQueries } from '@tanstack/svelte-query'
  import { sleep } from '../utils.svelte'
  import type { StatusResult } from '../utils.svelte'

  let { states }: { states: { value: Array<StatusResult<string>> } } = $props()

  const queries = createQueries({
    queries: [
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
    states.value = [...untrack(() => states.value), $state.snapshot(queries[0])]
  })
</script>

<div>{queries[0].data}</div>
<div>fetchStatus: {queries[0].fetchStatus}</div>
