<script lang="ts">
  import { resolve } from '$app/paths'
  import '../app.css'
  import { browser } from '$app/environment'
  import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'

  let { children } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })
</script>

<svelte:head>
  <title>TanStack Query Svelte Rick And Morty Example</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  <nav
    class="bg-gray-300 w-full flex flex-row gap-6 justify-center items-center h-12"
  >
    <a class="uppercase hover:underline" href={resolve('/')}>Home</a>
    <a class="uppercase hover:underline" href={resolve('/episodes')}>Episodes</a
    >
    <a class="uppercase hover:underline" href={resolve('/characters')}
      >Characters</a
    >
  </nav>
  <div class="p-2">
    {@render children()}
  </div>
  <SvelteQueryDevtools />
</QueryClientProvider>
