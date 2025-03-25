<script lang="ts">
  import '../app.css'
  import { browser } from '$app/environment'
  import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'

  const { children } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })
</script>

<svelte:head>
  <title>Svelte Query Playground Example</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  <div id="app">
    {@render children()}
  </div>
  <SvelteQueryDevtools />
</QueryClientProvider>
