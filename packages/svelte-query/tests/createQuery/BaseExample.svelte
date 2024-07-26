<script lang="ts">
  import { untrack } from 'svelte'
  import { createQuery } from '../../src/index.js'
  import type { QueryClient, QueryObserverResult } from '@tanstack/query-core'
  import type { CreateQueryOptions, FunctionedParams } from '../../src/index.js'

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
    // @ts-expect-error
    // svelte-ignore state_snapshot_uncloneable
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<div>Status: {query.status}</div>
<div>Failure Count: {query.failureCount}</div>
<div>Data: {query.data ?? 'undefined'}</div>
