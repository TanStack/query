<script lang="ts">
  import { untrack } from 'svelte'
  import { QueryClient } from '@tanstack/query-core'
  import { createInfiniteQuery } from '../../src/index.js'
  import { setQueryClientContext } from '../../src/context.js'
  import type { QueryObserverResult } from '@tanstack/query-core'
  import { queryKey, sleep } from '@tanstack/query-test-utils'

  let { states }: { states: { value: Array<QueryObserverResult> } } = $props()

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const query = createInfiniteQuery(() => ({
    queryKey: queryKey(),
    queryFn: () => sleep(10).then(() => ({ count: 1 })),
    select: (data) => ({
      pages: data.pages.map((x) => `count: ${x.count}`),
      pageParams: data.pageParams,
    }),
    getNextPageParam: () => undefined,
    initialPageParam: 0,
  }))

  $effect(() => {
    // @ts-expect-error
    // svelte-ignore state_snapshot_uncloneable
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<div>{query.data?.pages.join(',')}</div>
