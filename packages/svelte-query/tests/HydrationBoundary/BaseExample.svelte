<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import {
    HydrationBoundary,
    createQuery,
    setQueryClientContext,
  } from '../../src/index.js'
  import type { DehydratedState } from '@tanstack/query-core'

  let {
    queryClient,
    dehydratedState,
    queryFn,
  }: {
    queryClient: QueryClient
    dehydratedState: DehydratedState
    queryFn: () => Promise<string>
  } = $props()

  setQueryClientContext(queryClient)

  const query = createQuery(() => ({
    queryKey: ['string'],
    queryFn,
  }))
</script>

<HydrationBoundary state={dehydratedState} options={undefined} queryClient={undefined}>
  <div>data: {query.data ?? 'undefined'}</div>
</HydrationBoundary>
