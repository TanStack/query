<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../context'
  import { createQuery } from '../createQuery'
  import type { CreateQueryOptions } from '../types'

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
