<script lang="ts">
  import { untrack } from 'svelte'
  import { QueryClient } from '@tanstack/query-core'
  import { createInfiniteQuery } from '../../src/createInfiniteQuery'
  import { sleep } from '../utils.svelte'
  import type { QueryObserverResult } from '@tanstack/query-core'

  let { states }: { states: { value: Array<QueryObserverResult> } } = $props()

  const queryClient = new QueryClient()

  const query = createInfiniteQuery(
    {
      queryKey: ['test'],
      queryFn: async ({ pageParam }) => {
        await sleep(5)
        return Number(pageParam)
      },
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 0,
    },
    queryClient,
  )

  $effect(() => {
    states.value = [
      ...untrack(() => states.value),
      $state.snapshot(query) as unknown as QueryObserverResult,
    ]
  })
</script>

<div>Status: {query.status}</div>
