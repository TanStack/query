<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { Writable } from 'svelte/store'
  import type { StatusResult } from '../utils'

  export let key: Array<string>
  export let states: Writable<Array<StatusResult<string>>>

  const state = createQuery({
    queryKey: key,
    queryFn: async () => {
      await sleep(10)
      return 'fetched'
    },
  })

  $: states.update((prev) => [...prev, $state])
</script>

<div>
  <h1>{$state.data}</h1>
  <h2>fetchStatus: {$state.fetchStatus}</h2>
</div>
