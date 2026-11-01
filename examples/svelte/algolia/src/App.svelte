<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import './styles.css'
  import Search from './lib/Search.svelte'

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  <div class="App">
    <h1>TanStack Query with Algolia</h1>
    <Search />
  </div>
  <SvelteQueryDevtools initialIsOpen />
</QueryClientProvider>
