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

  const query = createQuery({
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
    JSON.stringify(query)
    untrack(() => {
      states.push($state.snapshot(query))
    })
  })
</script>

<div>
  <h1>{query.data}</h1>
  <h2>fetchStatus: {query.fetchStatus}</h2>
</div>
