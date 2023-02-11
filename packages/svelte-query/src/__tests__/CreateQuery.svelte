<script lang="ts">
  import { createQuery, QueryClient, type CreateQueryOptions } from '../index'
  import { setQueryClientContext } from '../context'

  export let options: CreateQueryOptions

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
