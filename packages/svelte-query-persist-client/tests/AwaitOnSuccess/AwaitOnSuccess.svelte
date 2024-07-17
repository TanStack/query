<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { Writable } from 'svelte/store'

  export let key: Array<string>
  export let states: Writable<Array<string>>

  const state = createQuery({
    queryKey: key,
    queryFn: async () => {
      states.update((s) => [...s, 'fetching'])
      await sleep(10)
      states.update((s) => [...s, 'fetched'])
      return 'fetched'
    },
  })
</script>

<div>
  <h1>{$state.data}</h1>
  <h2>fetchStatus: {$state.fetchStatus}</h2>
</div>
