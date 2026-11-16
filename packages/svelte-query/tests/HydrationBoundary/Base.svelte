<script lang="ts">
  import {
    HydrationBoundary,
    createQuery,
    setQueryClientContext,
  } from '../../src/index.js'
  import type { QueryClient } from '@tanstack/query-core'
  import type { DehydratedState } from '@tanstack/query-core'

  type Props = {
    queryClient: QueryClient
    dehydratedState: DehydratedState
    queryFn: () => Promise<string>
  }

  let { queryClient, dehydratedState, queryFn }: Props = $props()

  setQueryClientContext(queryClient)

  const query = createQuery(() => ({
    queryKey: ['string'],
    queryFn,
  }))
</script>

<HydrationBoundary state={dehydratedState}>
  <div>data: {query.data ?? 'undefined'}</div>
</HydrationBoundary>
