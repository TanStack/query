<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { queryKey } from '@tanstack/query-test-utils'
  import {
    setIsRestoringContext,
    setQueryClientContext,
  } from '../../src/context.js'
  import { createQuery } from '../../src/index.js'

  let {
    queryFn,
  }: {
    queryFn: () => Promise<string>
  } = $props()

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)
  setIsRestoringContext({ current: true })

  const query = createQuery(() => ({
    queryKey: queryKey(),
    queryFn,
  }))
</script>

<div>
  <div data-testid="status">{query.status}</div>
  <div data-testid="fetchStatus">{query.fetchStatus}</div>
  <div data-testid="data">{query.data ?? 'undefined'}</div>
</div>
