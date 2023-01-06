<script lang="ts">
  import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'
  import BasicQuery from './lib/BasicQuery.svelte'

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  <main>
    <h1>Basic Query</h1>
    <BasicQuery />
  </main>
</QueryClientProvider>
