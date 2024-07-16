<script lang="ts">
  import { createQuery } from '../../src/createQuery'
  import type { QueryClient } from '@tanstack/query-core'
  import type { Writable } from 'svelte/store'
  import type { CreateQueryOptions, StoreOrVal } from '../../src/types'

  export let options: StoreOrVal<CreateQueryOptions<any>>
  export let queryClient: QueryClient
  export let states: Writable<Array<any>>

  const query = createQuery(options, queryClient)

  $: states.update((prev) => [...prev, $query])
</script>

<div>Status: {$query.status}</div>
<div>Failure Count: {$query.failureCount}</div>

{#if $query.isPending}
  <div>Loading</div>
{:else if $query.isError}
  <div>Error</div>
{:else if $query.isSuccess}
  <div>{$query.data}</div>
{/if}
