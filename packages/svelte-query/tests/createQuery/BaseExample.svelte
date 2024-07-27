<script lang="ts">
  import { untrack } from 'svelte'
  import { createQuery } from '../../src'
  import type { QueryClient, QueryObserverResult } from '@tanstack/query-core'
  import type { CreateQueryOptions, FunctionedParams } from '../../src/types'

  let {
    options,
    queryClient,
    states,
  }: {
    options: FunctionedParams<CreateQueryOptions<any>>
    queryClient: QueryClient
    states: { value: Array<QueryObserverResult> }
  } = $props()

  const query = createQuery(options, queryClient)

  $effect(() => {
    states.value = [
      ...untrack(() => states.value),
      $state.snapshot(query) as QueryObserverResult,
    ]
  })
</script>

<div>Status: {query.status}</div>
<div>Failure Count: {query.failureCount}</div>
<div>Data: {query.data ?? 'undefined'}</div>
