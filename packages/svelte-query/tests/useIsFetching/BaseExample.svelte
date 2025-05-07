<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { derived, writable } from 'svelte/store'
  import { createQuery, useIsFetching } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  const queryClient = new QueryClient()
  const ready = writable(false)

  const isFetching = useIsFetching(undefined, queryClient)

  const options = derived(ready, ($ready) => ({
    queryKey: ['test'],
    queryFn: async () => {
      await sleep(5)
      return 'test'
    },
    enabled: $ready,
  }))

  const query = createQuery(options, queryClient)
</script>

<button on:click={() => ($ready = true)}>setReady</button>

<div>isFetching: {$isFetching}</div>
<div>Data: {$query.data ?? 'undefined'}</div>
