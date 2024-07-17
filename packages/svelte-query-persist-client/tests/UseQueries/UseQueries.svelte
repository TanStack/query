<script lang="ts">
  import { createQueries } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { StatusResult } from '../utils'
  import { untrack } from 'svelte'

  let { key, states = $bindable() } = $props<{
    key: Array<string>
    states: Array<StatusResult<string>>
  }>()

  const s = createQueries({
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

  $effect(() => {
    JSON.stringify(s)
    untrack(() => {
      states.push($state.snapshot(s[0]))
    })
  })
</script>

<div>
  <h1>{s[0].data}</h1>
  <h2>fetchStatus: {s[0].fetchStatus}</h2>
</div>
