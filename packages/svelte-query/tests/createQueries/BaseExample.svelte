<script lang="ts">
  import { createQueries } from '../../src/index.js'
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
      queries: () => [...QueriesOptions<any>]
      combine?: (result: QueriesResults<Array<any>>) => any
    }
    queryClient: QueryClient
  } = $props()

  const queries = createQueries(options, queryClient)
</script>

{#each queries as query, index}
  <div>Status {index + 1}: {query.status}</div>
  <div>Data {index + 1}: {query.data}</div>
{/each}
