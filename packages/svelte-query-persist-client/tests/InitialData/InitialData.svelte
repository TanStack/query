<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { StatusResult } from '../utils'
  import { untrack } from 'svelte'

  let { key, states = $bindable() } = $props<{
    key: Array<string>
    states: Array<StatusResult<string>>
  }>()

  const s = createQuery({
    queryKey: key,
    queryFn: async () => {
      await sleep(10)
      return 'fetched'
    },

    initialData: 'initial',
    // make sure that initial data is older than the hydration data
    // otherwise initialData would be newer and takes precedence
    initialDataUpdatedAt: 1,
  })

  $effect(() => {
    console.log('initial data', s)
    JSON.stringify(s)
    untrack(() => {
      states.push($state.snapshot(s))
    })
  })
</script>

<div>
  <h1>{s.data}</h1>
  <h2>fetchStatus: {s.fetchStatus}</h2>
</div>
