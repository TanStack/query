<script lang="ts">
  import { createQueries } from '../../src/createQueries.svelte'
  import type { QueryClient } from '@tanstack/query-core'
  import type {
    QueriesOptions,
    QueriesResults,
  } from '../../src/createQueries.svelte'

  let {
    options,
    queryClient,
  }: {
    options: {
      queries: [...QueriesOptions<any>]
      combine?: (result: QueriesResults<Array<any>>) => any
    }
    queryClient: QueryClient
  } = $props()

  const queries = createQueries(options, queryClient)
</script>

{#if Array.isArray(queries)}
  {#each queries as query, index}
    {#if query.isPending}
      <div>Loading {index + 1}</div>
    {:else if query.isSuccess}
      <div>{query.data}</div>
    {/if}
  {/each}
{:else if queries.isPending}
  <div>Loading</div>
{:else if queries.isSuccess}
  <div>{queries.data}</div>
{/if}
