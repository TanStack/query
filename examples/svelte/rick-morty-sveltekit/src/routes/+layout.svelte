<script lang="ts">
  import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'
  import '../app.css'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import { browser } from '$app/environment'
  import { resolve } from '$app/paths'
  import type { LayoutProps } from './$types'

  let { children }: LayoutProps = $props()

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
