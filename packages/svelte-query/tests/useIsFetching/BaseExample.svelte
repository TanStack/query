<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { derived, writable } from 'svelte/store'
  import { createQuery } from '../../src/'
  import { useIsFetching } from '../../src/useIsFetching.svelte'
  import { queryKey, sleep } from '../utils'

  const queryClient = new QueryClient()
  const key = queryKey()
  let ready = $state(false)

  const isFetching = useIsFetching(undefined, queryClient)

  const options = $derived({
    queryKey: [key],
    queryFn: async () => {
      await sleep(20)
      return 'test'
    },
    enabled: ready,
  })

  const query = createQuery(options, queryClient)
</script>

<button on:click={() => (ready = true)}>setReady</button>
<div>isFetching: {isFetching()}</div>

{#if query.isSuccess}
  {query.data}
{/if}
