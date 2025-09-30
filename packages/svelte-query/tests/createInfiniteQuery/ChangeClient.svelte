<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createInfiniteQuery } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  let { queryClient }: { queryClient: QueryClient } = $props()

  const queryKey = ['test']

  let firstPage = $state(0)

  const query = createInfiniteQuery(
    () => ({
      queryKey: queryKey,
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: firstPage,
    }),
    () => queryClient,
  )
</script>

<button
  onclick={() => {
    queryClient.setQueryData(queryKey, {
      pages: [7, 8],
      pageParams: [7, 8],
    })
    firstPage = 7
  }}
>
  setPages
</button>

<div>Data: {JSON.stringify(query.data)}</div>
