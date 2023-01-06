<script lang="ts">
  import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'
  import LoadMore from './lib/LoadMore.svelte'

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  <main>
    <h1>Infinte Load More</h1>
    <LoadMore />
  </main>
</QueryClientProvider>
