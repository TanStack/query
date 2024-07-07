<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { derived, writable } from 'svelte/store'
  import { createQuery } from '../../src/createQuery'
  import { useIsFetching } from '../../src/useIsFetching'
  import { queryKey, sleep } from '../utils'

  const queryClient = new QueryClient()
  const key = queryKey()
  const ready = writable(false)

  const isFetching = useIsFetching(undefined, queryClient)

  const options = derived(ready, ($ready) => ({
    queryKey: [key],
    queryFn: async () => {
      await sleep(20)
      return 'test'
    },
    enabled: $ready,
  }))

  const query = createQuery(options, queryClient)
</script>

<button on:click={() => ($ready = true)}>setReady</button>
<div>isFetching: {$isFetching}</div>

{#if $query.isSuccess}
  {$query.data}
{/if}
