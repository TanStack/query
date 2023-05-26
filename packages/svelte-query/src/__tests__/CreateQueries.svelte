<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../context.ts'
  import { createQueries } from '../createQueries.ts'
  import type { QueriesOptions } from '../createQueries.ts'

  export let options: { queries: [...QueriesOptions<any>] }

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const queries = createQueries(options)
</script>

{#each $queries as query, index}
  {#if query.isPending}
    <p>Loading {index + 1}</p>
  {:else if query.isSuccess}
    <p>{query.data}</p>
  {/if}
{/each}
