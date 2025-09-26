<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createInfiniteQuery } from '../../src/index.js'
  import type { QueryObserverResult } from '@tanstack/query-core'
  import type { Writable } from 'svelte/store'
  import { sleep } from '@tanstack/query-test-utils'

  export let states: Writable<Array<QueryObserverResult>>

  const queryClient = new QueryClient()

  const query = createInfiniteQuery(
    {
      queryKey: ['test'],
      queryFn: () => sleep(10).then(() => ({ count: 1 })),
      select: (data) => ({
        pages: data.pages.map((x) => `count: ${x.count}`),
        pageParams: data.pageParams,
      }),
      getNextPageParam: () => undefined,
      initialPageParam: 0,
    },
    queryClient,
  )

  $: states.update((prev) => [...prev, $query])
</script>

<div>{$query.data?.pages.join(',')}</div>
