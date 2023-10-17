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
  {#if Array.isArray($query.data)}
    {#each $query.data as item}
      <p>{item}</p>
    {/each}
  {:else}
    <p>{$query.data}</p>
  {/if}
{/if}
