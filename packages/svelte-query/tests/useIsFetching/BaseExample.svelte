<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createQuery, useIsFetching } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  const queryClient = new QueryClient()
  let ready = $state(false)

  const isFetching = useIsFetching(undefined, queryClient)

  const query = createQuery(
    () => ({
      queryKey: ['test'],
      queryFn: () => sleep(10).then(() => 'test'),
      enabled: ready,
    }),
    () => queryClient,
  )
</script>

<button onclick={() => (ready = true)}>setReady</button>

<div>isFetching: {isFetching.current}</div>
<div>Data: {query.data ?? 'undefined'}</div>
