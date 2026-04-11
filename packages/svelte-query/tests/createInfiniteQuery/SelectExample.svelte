<script lang="ts">
  import { untrack } from 'svelte'
  import { createInfiniteQuery } from '../../src/index.js'
  import { setQueryClientContext } from '../../src/context.js'
  import type { QueryClient, QueryObserverResult } from '@tanstack/query-core'
  import { queryKey, sleep } from '@tanstack/query-test-utils'

  type Props = {
    queryClient: QueryClient
    states: { value: Array<QueryObserverResult> }
  }

  let { queryClient, states }: Props = $props()

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
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<div>{query.data?.pages.join(',')}</div>
