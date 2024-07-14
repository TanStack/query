<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createInfiniteQuery } from '../../src/createInfiniteQuery'

  const queryClient = new QueryClient()

  const query = createInfiniteQuery(
    {
      queryKey: ['test'],
      queryFn: ({ pageParam }) => Number(pageParam),
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 0,
    },
    queryClient,
  )
  console.log('INFITE', query.data, query.data)
</script>

<div>Data: {JSON.stringify(query.data)}</div>
<div>Status: {query.status}</div>
