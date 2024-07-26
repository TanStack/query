<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createQuery } from '../../src/createQuery'
  import { useIsFetching } from '../../src/useIsFetching.svelte'
  import { sleep } from '../utils.svelte'

  const queryClient = new QueryClient()
  let ready = $state(false)

  const isFetching = useIsFetching(undefined, queryClient)

  const options = $derived({
    queryKey: ['test'],
    queryFn: async () => {
      await sleep(5)
      return 'test'
    },
    enabled: ready,
  })

  const query = createQuery(options, queryClient)
</script>

<button onclick={() => (ready = true)}>setReady</button>

<div>isFetching: {isFetching()}</div>
<div>Data: {query.data ?? 'undefined'}</div>
