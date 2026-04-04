<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setIsRestoringContext } from '../../src/context.js'
  import { createQueries } from '../../src/index.js'

  let {
    queryClient,
    queryFn1,
    queryFn2,
  }: {
    queryClient: QueryClient
    queryFn1: () => Promise<string>
    queryFn2: () => Promise<string>
  } = $props()

  setIsRestoringContext({ current: true })

  const result = createQueries(
    () => ({
      queries: [
        { queryKey: ['restoring-1'], queryFn: queryFn1 },
        { queryKey: ['restoring-2'], queryFn: queryFn2 },
      ],
    }),
    () => queryClient,
  )
</script>

<div>
  <div data-testid="status1">{result[0].status}</div>
  <div data-testid="status2">{result[1].status}</div>
  <div data-testid="fetchStatus1">{result[0].fetchStatus}</div>
  <div data-testid="fetchStatus2">{result[1].fetchStatus}</div>
  <div data-testid="data1">{result[0].data ?? 'undefined'}</div>
  <div data-testid="data2">{result[1].data ?? 'undefined'}</div>
</div>
