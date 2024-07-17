<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { Writable } from 'svelte/store'

  export let states: Writable<Array<string>>

  const query = createQuery({
    queryKey: ['test'],
    queryFn: async () => {
      states.update((s) => [...s, 'fetching'])
      await sleep(10)
      states.update((s) => [...s, 'fetched'])
      return 'fetched'
    },
  })
</script>

<div>{$query.data}</div>
<div>fetchStatus: {$query.fetchStatus}</div>
