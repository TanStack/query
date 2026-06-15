<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createInfiniteQuery } from '../../src/index.js'
  import { setQueryClientContext } from '../../src/context.js'
  import { sleep } from '@tanstack/query-test-utils'

  type Props = {
    queryClient: QueryClient
  }

  let { queryClient }: Props = $props()

  const queryKey = ['test']

  let firstPage = $state(0)

  setQueryClientContext(queryClient)

  const query = createInfiniteQuery(() => ({
    queryKey: queryKey,
    queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
    getNextPageParam: (lastPage) => lastPage + 1,
    initialPageParam: firstPage,
  }))
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
