<script lang="ts">
  import { createQueries } from '../../src/createQueries'
  import type { QueryClient } from '@tanstack/query-core'
  import type { QueriesOptions, QueriesResults } from '../../src/createQueries'

  export let options: {
    queries: [...QueriesOptions<any>]
    combine?: (result: QueriesResults<Array<any>>) => any
  }
  export let queryClient: QueryClient

  const queries = createQueries(options, queryClient)
</script>

{#if Array.isArray($queries)}
  {#each queries as query, index}
    {#if query.isPending}
      <p>Loading {index + 1}</p>
    {:else if query.isSuccess}
      <p>{query.data}</p>
    {/if}
  {/each}
{:else if queries.isPending}
  <p>Loading</p>
{:else if queries.isSuccess}
  <p>{queries.data}</p>
{/if}
