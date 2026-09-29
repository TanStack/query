<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { createQuery, setQueryClientContext } from '../../src/index.js'
  import type { CreateQueryOptions } from '../../src/index.js'

  type Props = {
    queryClient: QueryClient
    startCount?: number
    options: (count: number) => CreateQueryOptions<number, Error>
  }

  let { queryClient, startCount = 0, options }: Props = $props()

  let count = $state(startCount)

  setQueryClientContext(queryClient)

  const query = createQuery<number, Error>(() => options(count))
</script>

<button onclick={() => count++}>increment</button>
<button onclick={() => query.refetch()}>refetch</button>

<div data-testid="data">{query.data ?? 'undefined'}</div>
<div data-testid="status">{query.status}</div>
<div data-testid="fetchStatus">{query.fetchStatus}</div>
<div data-testid="isFetching">{query.isFetching}</div>
<div data-testid="isSuccess">{query.isSuccess}</div>
<div data-testid="isPlaceholderData">{query.isPlaceholderData}</div>
