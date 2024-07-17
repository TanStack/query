<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { StatusResult } from '../utils'
  import { untrack } from 'svelte'

  let { key, states = $bindable() } = $props<{
    key: Array<string>
    states: Array<StatusResult<string>>
    fetched: boolean
  }>()

  const s = createQuery({
    queryKey: key,
    queryFn: async () => {
      states.push('fetched')
      return 'fetched'
    },

    staleTime: Infinity,
  })
  $effect(() => {
    JSON.stringify(s.data)
    untrack(() => {
      states.push($state.snapshot(s))
    })
  })
</script>

<div>
  <h1>data: {s.data ?? 'null'}</h1>
  <h2>fetchStatus: {s.fetchStatus}</h2>
</div>
