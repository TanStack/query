<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '@tanstack/query-test-utils'
  import type { Writable } from 'svelte/store'
  import type { StatusResult } from '../utils.js'

  export let states: Writable<Array<StatusResult<string>>>

  const query = createQuery({
    queryKey: ['test'],
    queryFn: async () => {
      await sleep(5)
      return 'fetched'
    },
  })

  $: states.update((prev) => [...prev, $query])
</script>

<div>{$query.data}</div>
<div>fetchStatus: {$query.fetchStatus}</div>
