<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../context'
  import { createQuery } from '../createQuery'
  import type { CreateQueryOptions, WritableOrVal } from '../types'

  export let options: WritableOrVal<CreateQueryOptions<any>>

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const query = createQuery(options)
</script>

{#if $query.isPending}
  <p>Loading</p>
{:else if $query.isError}
  <p>Error</p>
{:else if $query.isSuccess}
  <p>Success</p>
{/if}

<ul>
  {#each $query.data ?? [] as entry}
    <li>id: {entry.id}</li>
  {/each}
</ul>
