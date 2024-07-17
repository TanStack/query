<script lang="ts">
  import { untrack } from 'svelte'
  import { createQuery } from '../../src'
  import type { QueryClient, QueryObserverResult } from '@tanstack/query-core'
  import type { CreateQueryOptions } from '../../src/types'

  let {
    options,
    queryClient,
    states = $bindable(),
  }: {
    options: CreateQueryOptions<any>
    queryClient: QueryClient
    states: Array<QueryObserverResult>
  } = $props()

  const query = createQuery(options, queryClient)

  $effect(() => {
    JSON.stringify(query)
    untrack(() => {
      states.push($state.snapshot(query))
    })
  })
</script>

<div>Status: {query.status}</div>
<div>Failure Count: {query.failureCount}</div>

{#if query.isPending}
  <div>Loading</div>
{:else if query.isError}
  <div>Error</div>
{:else if query.isSuccess}
  <div>{query.data}</div>
{/if}
