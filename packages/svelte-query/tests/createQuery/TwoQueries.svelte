<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { QueryClient } from '@tanstack/query-core'
  import { createQuery, setQueryClientContext } from '../../src/index.js'
  import type { Accessor, CreateQueryOptions } from '../../src/index.js'

  type Props = {
    queryClient: QueryClient
    options1: Accessor<CreateQueryOptions>
    options2: Accessor<CreateQueryOptions>
  }

  let { queryClient, options1, options2 }: Props = $props()

  setQueryClientContext(queryClient)

  onMount(() => queryClient.mount())
  onDestroy(() => queryClient.unmount())

  const query1 = createQuery(options1)
  const query2 = createQuery(options2)
</script>

<button onclick={() => query1.refetch()}>refetch1</button>

<div data-testid="status1">{query1.status}</div>
<div data-testid="fetchStatus1">{query1.fetchStatus}</div>
<div data-testid="data1">{query1.data ?? 'undefined'}</div>
<div data-testid="isStale1">{query1.isStale}</div>

<div data-testid="status2">{query2.status}</div>
<div data-testid="fetchStatus2">{query2.fetchStatus}</div>
<div data-testid="data2">{query2.data ?? 'undefined'}</div>
<div data-testid="isStale2">{query2.isStale}</div>
