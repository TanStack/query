<script lang="ts">
  import { untrack } from 'svelte'
  import { QueryClient } from '@tanstack/query-core'
  import { sleep } from '@tanstack/query-test-utils'
  import { createInfiniteQuery } from '../../src/index.js'
  import type { QueryObserverResult } from '@tanstack/query-core'
  import { sleep } from '@tanstack/query-test-utils'

  let { states }: { states: { value: Array<QueryObserverResult> } } = $props()

  const queryClient = new QueryClient()

  const query = createInfiniteQuery(
    () => ({
      queryKey: ['test'],
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 0,
    }),
    () => queryClient,
  )

  $effect(() => {
    // @ts-expect-error
    // svelte-ignore state_snapshot_uncloneable
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<div>Status: {query.status}</div>
