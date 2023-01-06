<script lang="ts">
  import '../app.css'
  import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'

  const queryClient = new QueryClient()
</script>

<svelte:head>
  <title>Svelte Query Star Wars Example</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  <slot />
</QueryClientProvider>
