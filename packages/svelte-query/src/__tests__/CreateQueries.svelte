<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createQueries } from '../createQueries'
  import type { QueriesOptions, QueriesResults } from '../createQueries'

  export let options: {
    queries: [...QueriesOptions<any>]
    combine?: (result: QueriesResults<any[]>) => any
  }
  export let queryClient: QueryClient

  const queries = createQueries(options, queryClient)
</script>

{#each $queries as query, index}
  {#if query.isPending}
    <p>Loading {index + 1}</p>
  {:else if query.isSuccess}
    <p>{query.data}</p>
  {/if}
{/each}
