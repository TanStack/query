<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { StatusResult } from '../utils'

  let { key, states } = $props<{
    key: Array<string>
    states: Array<StatusResult<string>>
  }>()

  const state = createQuery({
    queryKey: key,
    queryFn: async () => {
      await sleep(10)
      return 'fetched'
    },
  })

  $effect(() => {
    states = [...states, state]
  })
</script>

<div>
  <h1>{state.data}</h1>
  <h2>fetchStatus: {state.fetchStatus}</h2>
</div>
