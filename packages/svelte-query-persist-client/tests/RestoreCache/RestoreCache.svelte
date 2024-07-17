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
  } = $props()

  const ss = createQuery({
    queryKey: key,
    queryFn: async () => {
      await sleep(10)
      return 'fetched'
    },
  })

  $effect(() => {
    console.log('initial data', ss)
    JSON.stringify(ss)
    untrack(() => {
      states.push($state.snapshot(ss))
    })
  })
</script>

<div>
  <h1>{ss.data}</h1>
  <h2>fetchStatus: {ss.fetchStatus}</h2>
</div>
