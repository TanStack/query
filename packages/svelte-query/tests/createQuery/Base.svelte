<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { QueryClient } from '@tanstack/query-core'
  import { createQuery, setQueryClientContext } from '../../src/index.js'
  import type { Accessor, CreateQueryOptions } from '../../src/index.js'

  type Props = {
    queryClient: QueryClient
    options: Accessor<CreateQueryOptions>
  }

  let { queryClient, options }: Props = $props()

  setQueryClientContext(queryClient)

  // QueryClientProvider normally mounts/unmounts the client; since this fixture
  // sets the context directly, do it manually so focus/online refetching works
  onMount(() => queryClient.mount())
  onDestroy(() => queryClient.unmount())

  const query = createQuery(options)
</script>

<button onclick={() => query.refetch()}>refetch</button>
<button onclick={() => query.refetch({ cancelRefetch: false })}>
  refetch no cancel
</button>

<div data-testid="status">{query.status}</div>
<div data-testid="fetchStatus">{query.fetchStatus}</div>
<div data-testid="data">{query.data ?? 'undefined'}</div>
<div data-testid="dataUpdatedAt">{query.dataUpdatedAt}</div>
<div data-testid="error">
  {(query.error as Error | null)?.message ?? 'null'}
</div>
<div data-testid="isFetched">{query.isFetched}</div>
<div data-testid="isFetchedAfterMount">{query.isFetchedAfterMount}</div>
<div data-testid="isStale">{query.isStale}</div>
<div data-testid="isFetching">{query.isFetching}</div>
<div data-testid="isSuccess">{query.isSuccess}</div>
<div data-testid="isPlaceholderData">{query.isPlaceholderData}</div>
