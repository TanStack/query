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
  <title>Svelte Query Star Wars Example</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  <nav
    class="bg-gray-300 w-full flex flex-row gap-4 justify-center items-center h-10"
  >
    <a href="/">Home</a>
    <a href="/films">Films</a>
    <a href="/characters">Characters</a>
  </nav>
  {@render children()}
  <SvelteQueryDevtools />
</QueryClientProvider>
