<script lang="ts">
  import { createQuery } from '../createQuery'
  import type { QueryClient } from '@tanstack/query-core'
  import type { CreateQueryOptions } from '../types'

  export let options: CreateQueryOptions<any>
  export let queryClient: QueryClient

  const query = createQuery(options, queryClient)
</script>

{#if $query.isPending}
  <p>Loading</p>
{:else if $query.isError}
  <p>Error</p>
{:else if $query.isSuccess}
  <p>{$query.data}</p>
{/if}

<ul>
  {#each $query.data ?? [] as entry}
    <li>id: {entry.id}</li>
  {/each}
</ul>
