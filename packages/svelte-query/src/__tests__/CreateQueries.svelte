<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../context'
  import { createQueries } from '../createQueries'
  import type { QueriesOptions } from '../createQueries'

  export let options: readonly [...QueriesOptions<any>]

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const queries = createQueries(options)
</script>

{#each $queries as query}
  {#if query.isSuccess}
    <p>{query.data}</p>
  {/if}
{/each}
