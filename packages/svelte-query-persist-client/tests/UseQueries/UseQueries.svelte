<script lang="ts">
  import { createQueries } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { StatusResult } from '../utils'

  let { key, states } = $props<{
    key: Array<string>
    states: Array<StatusResult<string>>
  }>()

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

  $effect(() => {
    states = [...states, state[0]]
  })
</script>

<div>
  <h1>{state[0].data}</h1>
  <h2>fetchStatus: {state[0].fetchStatus}</h2>
</div>
