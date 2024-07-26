<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createQuery, useIsFetching } from '../../src/index.js'
  import { sleep } from '../utils.svelte.js'

  const queryClient = new QueryClient()
  let ready = $state(false)

  const isFetching = useIsFetching(undefined, queryClient)

  const query = createQuery(
    () => ({
      queryKey: ['test'],
      queryFn: async () => {
        await sleep(5)
        return 'test'
      },
      enabled: ready,
    }),
    queryClient,
  )
</script>

<button onclick={() => (ready = true)}>setReady</button>

<div>isFetching: {isFetching()}</div>
<div>Data: {query.data ?? 'undefined'}</div>
