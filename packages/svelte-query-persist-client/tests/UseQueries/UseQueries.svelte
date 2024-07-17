<script lang="ts">
  import { createQueries } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { Writable } from 'svelte/store'
  import type { StatusResult } from '../utils'

  export let key: Array<string>
  export let states: Writable<Array<StatusResult<string>>>

  const state = createQueries({
    queries: [
      {
        queryKey: key,
        queryFn: async (): Promise<string> => {
          await sleep(10)
          return 'fetched'
        },
      },
    ],
  })

  $: states.update((prev) => [...prev, $state[0]])
</script>

<div>
  <h1>{$state[0].data}</h1>
  <h2>fetchStatus: {$state[0].fetchStatus}</h2>
</div>
