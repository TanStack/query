<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { queryKey } from '@tanstack/query-test-utils'
  import {
    setIsRestoringContext,
    setQueryClientContext,
  } from '../../src/context.js'
  import { createQueries } from '../../src/index.js'

  type Props = {
    queryClient: QueryClient
    queryFn1: () => Promise<string>
    queryFn2: () => Promise<string>
  }

  let { queryClient, queryFn1, queryFn2 }: Props = $props()

  setQueryClientContext(queryClient)
  setIsRestoringContext({ current: true })

  const result = createQueries(() => ({
    queries: [
      { queryKey: queryKey(), queryFn: queryFn1 },
      { queryKey: queryKey(), queryFn: queryFn2 },
    ],
  }))
</script>

<div>
  <div data-testid="status1">{result[0].status}</div>
  <div data-testid="status2">{result[1].status}</div>
  <div data-testid="fetchStatus1">{result[0].fetchStatus}</div>
  <div data-testid="fetchStatus2">{result[1].fetchStatus}</div>
  <div data-testid="data1">{result[0].data ?? 'undefined'}</div>
  <div data-testid="data2">{result[1].data ?? 'undefined'}</div>
</div>
