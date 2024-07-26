<script lang="ts">
  import { untrack } from 'svelte'
  import { QueryClient } from '@tanstack/query-core'
  import { createInfiniteQuery } from '../../src/index.js'
  import type { QueryObserverResult } from '@tanstack/query-core'

  let { states }: { states: { value: Array<QueryObserverResult> } } = $props()

  const queryClient = new QueryClient()

  const query = createInfiniteQuery(
    () => ({
      queryKey: ['test'],
      queryFn: () => Promise.resolve({ count: 1 }),
      select: (data) => ({
        pages: data.pages.map((x) => `count: ${x.count}`),
        pageParams: data.pageParams,
      }),
      getNextPageParam: () => undefined,
      initialPageParam: 0,
    }),
    queryClient,
  )

  $effect(() => {
    // @ts-expect-error
    // svelte-ignore state_snapshot_uncloneable
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<div>{query.data?.pages.join(',')}</div>
