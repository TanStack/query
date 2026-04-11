<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { queryKey, sleep } from '@tanstack/query-test-utils'
  import { setQueryClientContext } from '../../src/context.js'
  import { createQuery, useIsFetching } from '../../src/index.js'

  type Props = {
    queryClient: QueryClient
  }

  let { queryClient }: Props = $props()

  setQueryClientContext(queryClient)

  let ready = $state(false)

  const query = createQuery(() => ({
    queryKey: queryKey(),
    queryFn: () => sleep(10).then(() => 'test'),
    enabled: ready,
  }))

  const isFetching = useIsFetching()
</script>

<button onclick={() => (ready = true)}>setReady</button>

<div>isFetching: {isFetching.current}</div>
<div>Data: {query.data ?? 'undefined'}</div>
