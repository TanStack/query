<script lang="ts">
  import '../app.css'
  import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'

  const queryClient = new QueryClient()
</script>

<svelte:head>
  <title>Svelte Query Star Wars Example</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  <nav
    class="bg-gray-300 w-full flex flex-row gap-4 justify-center items-center h-10"
  >
    <a href="/"> Home </a>
    <a href="/films"> Films </a>
    <a href="/characters"> Characters </a>
  </nav>
  <slot />
</QueryClientProvider>
