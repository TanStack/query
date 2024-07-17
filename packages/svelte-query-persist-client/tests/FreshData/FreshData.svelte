<script lang="ts">
  import { untrack } from 'svelte'
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { StatusResult } from '../utils'

  let {
    key,
    states = $bindable(),
  }: {
    key: Array<string>
    states: Array<StatusResult<string>>
    fetched: boolean
  } = $props()

  const query = createQuery({
    queryKey: key,
    queryFn: async () => {
      states.push('fetched')
      await sleep(10)
      return 'fetched'
    },

    staleTime: Infinity,
  })
  $effect(() => {
    JSON.stringify(query.data)
    untrack(() => {
      states.push($state.snapshot(query))
    })
  })
</script>

<div>
  <h1>data: {query.data ?? 'null'}</h1>
  <h2>fetchStatus: {query.fetchStatus}</h2>
</div>
