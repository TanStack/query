<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import {
    HydrationBoundary,
    createQuery,
    setQueryClientContext,
  } from '../../src/index.js'
  import type { DehydratedState } from '@tanstack/query-core'

  let {
    dehydratedState,
    queryFn,
  }: {
    dehydratedState: DehydratedState
    queryFn: () => Promise<string>
  } = $props()

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const query = createQuery(() => ({
    queryKey: ['string'],
    queryFn,
  }))
</script>

<HydrationBoundary
  state={dehydratedState}
  options={undefined}
  queryClient={undefined}
>
  <div>data: {query.data ?? 'undefined'}</div>
</HydrationBoundary>
