<script lang="ts">
  import '../app.css'
  import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'

  const queryClient = new QueryClient()
</script>

<svelte:head>
  <title>Svelte Query Playground Example</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  <div id="app">
    <slot />
  </div>
</QueryClientProvider>
