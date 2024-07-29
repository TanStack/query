<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createInfiniteQuery } from '../../src/createInfiniteQuery'
  import type { QueryObserverResult } from '@tanstack/query-core'
  import type { Writable } from 'svelte/store'

  export let states: Writable<Array<QueryObserverResult>>

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

  $: states.update((prev) => [...prev, $query])
</script>

<div>Status: {$query.status}</div>
