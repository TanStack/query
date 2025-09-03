<script lang="ts">
  import { createQueries } from '@tanstack/svelte-query'
  import { sleep } from '@tanstack/query-test-utils'
  import type { Writable } from 'svelte/store'
  import type { StatusResult } from '../utils.js'

  export let states: Writable<Array<StatusResult<string>>>

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

  $: states.update((prev) => [...prev, $queries[0]])
</script>

<div>{$queries[0].data}</div>
<div>fetchStatus: {$queries[0].fetchStatus}</div>
