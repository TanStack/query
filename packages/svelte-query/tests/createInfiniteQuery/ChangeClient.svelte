<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createInfiniteQuery } from '../../src/index.js'
  import type { QueryObserverResult } from '@tanstack/query-core'
  import type { Writable } from 'svelte/store'
  import { sleep } from '@tanstack/query-test-utils'

  export let states: Writable<Array<QueryObserverResult>>
  export let queryClient: QueryClient

  const queryKey = ['test']
  
  let firstPage = 0

  const query = createInfiniteQuery(
    {
    queryKey: queryKey,
    queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
    getNextPageParam: (lastPage) => lastPage + 1,
    initialPageParam: firstPage,
    },
    queryClient,
  )

  $: states.update((prev) => [...prev, $query])
</script>

<button
on:click={() => {
    queryClient.setQueryData(queryKey, {
    pages: [7, 8],
    pageParams: [7, 8],
    })
    firstPage = 7
}}
>
setPages
</button>

<div>Data: {JSON.stringify($query.data)}</div>
