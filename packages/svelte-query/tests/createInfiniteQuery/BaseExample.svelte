<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createInfiniteQuery } from '../../src/createInfiniteQuery'
  import { sleep } from '../utils'
  const queryClient = new QueryClient()

  const query = createInfiniteQuery(
    {
      queryKey: ['test'],
      queryFn: async ({ pageParam }) => {
        await sleep(600)
        return Number(pageParam)
      },
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 0,
    },
    queryClient,
  )
</script>

<div>Data: {JSON.stringify(query.data) || 'undefined'}</div>
<div>Status: {query.status}</div>
