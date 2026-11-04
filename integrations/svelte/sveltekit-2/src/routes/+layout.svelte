<script>
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'

  let { children } = $props()

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
  <SvelteQueryDevtools />
</QueryClientProvider>
