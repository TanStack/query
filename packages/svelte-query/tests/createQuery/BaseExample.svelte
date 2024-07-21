<script lang="ts">
  import { createQuery } from '../../src/createQuery'
  import type { QueryClient, QueryObserverResult } from '@tanstack/query-core'
  import type { Writable } from 'svelte/store'
  import type { CreateQueryOptions, StoreOrVal } from '../../src/types'

  export let options: StoreOrVal<CreateQueryOptions<any>>
  export let queryClient: QueryClient
  export let states: Writable<Array<QueryObserverResult>>

  const query = createQuery(options, queryClient)

  $: states.update((prev) => [...prev, $query])
</script>

<div>Status: {$query.status}</div>
<div>Failure Count: {$query.failureCount}</div>
<div>Data: {$query.data ?? 'undefined'}</div>
