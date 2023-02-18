<script lang="ts">
  import { createQueries, QueryClient } from '../index'
  import { setQueryClientContext } from '../context'
  import type { QueriesOptions } from '../createQueries'

  export let options: { queries: readonly [...QueriesOptions<any>] }

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
