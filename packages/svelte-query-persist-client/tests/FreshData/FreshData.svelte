<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { StatusResult } from '../utils'

  let { key, states, fetched } = $props<{
    key: Array<string>
    states: Array<StatusResult<string>>
    fetched: boolean
  }>()

  const state = createQuery({
    queryKey: key,
    queryFn: async () => {
      fetched.set(true)
      await sleep(10)
      return 'fetched'
    },

    staleTime: Infinity,
  })

  $effect(() => {
    states = [...states, state]
  })
</script>

<div>
  <h1>data: {state.data ?? 'null'}</h1>
  <h2>fetchStatus: {state.fetchStatus}</h2>
</div>
