<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import {
    setIsRestoringContext,
    setQueryClientContext,
  } from '../../src/context.js'
  import { createQuery } from '../../src/index.js'

  type Props = {
    queryClient: QueryClient
    queryFn: () => Promise<string>
    queryKey: Array<string>
    isRestoringRef: { current: boolean }
  }

  let { queryClient, queryFn, queryKey, isRestoringRef }: Props = $props()

  setQueryClientContext(queryClient)
  setIsRestoringContext(isRestoringRef)

  const query = createQuery(() => ({
    queryKey,
    queryFn,
  }))
</script>

<div>
  <div data-testid="status">{query.status}</div>
  <div data-testid="fetchStatus">{query.fetchStatus}</div>
  <div data-testid="data">{query.data ?? 'undefined'}</div>
</div>