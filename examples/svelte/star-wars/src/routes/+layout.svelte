<script lang="ts">
  import '../app.css'
  import { browser } from '$app/environment'
  import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })
</script>

<svelte:head>
  <title>TanStack Query Svelte Star Wars Example</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  <nav
    class="bg-gray-300 w-full flex flex-row gap-6 justify-center items-center h-12"
  >
    <a class="uppercase hover:underline" href="/">Home</a>
    <a class="uppercase hover:underline" href="/films">Films</a>
    <a class="uppercase hover:underline" href="/characters">Characters</a>
  </nav>
  <div class="p-2">
    <slot />
  </div>
  <SvelteQueryDevtools />
</QueryClientProvider>
