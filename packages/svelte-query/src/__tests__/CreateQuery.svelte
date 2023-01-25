<script lang="ts">
  import {
    createQuery,
    QueryClient,
    type CreateQueryOptions,
    type WritableOrVal,
  } from '../index'
  import { setQueryClientContext } from '../context'

  export let options: WritableOrVal<CreateQueryOptions>

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const query = createQuery(options)
</script>

{#if $query.isLoading}
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
