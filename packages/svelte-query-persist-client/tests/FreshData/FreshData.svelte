<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { Writable } from 'svelte/store'
  import type { StatusResult } from '../utils'

  export let states: Writable<Array<StatusResult<string>>>
  export let fetched: Writable<boolean>

  const query = createQuery({
    queryKey: ['test'],
    queryFn: async () => {
      fetched.set(true)
      await sleep(10)
      return 'fetched'
    },

    staleTime: Infinity,
  })

  $: states.update((prev) => [...prev, $query])
</script>

<div>data: {$query.data ?? 'null'}</div>
<div>fetchStatus: {$query.fetchStatus}</div>
