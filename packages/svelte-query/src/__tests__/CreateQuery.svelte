<script lang="ts">
  import { createQuery, QueryClient } from '../index'
  import { setQueryClientContext } from '../context'

  export let queryKey: Array<string>
  export let queryFn: () => Promise<string>

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const query = createQuery({
    queryKey,
    queryFn,
  })
</script>

{#if $query.isLoading}
  <p>Loading</p>
{:else if $query.isError}
  <p>Error</p>
{:else if $query.isSuccess}
  <p>Success</p>
{/if}
