<script lang="ts">
  import { resolve } from '$app/paths'
  import '../app.css'
  import { browser } from '$app/env'
  import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
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
  <title>TanStack Query Svelte Star Wars Example</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  <nav
    class="bg-gray-300 w-full flex flex-row gap-6 justify-center items-center h-12"
  >
    <a class="uppercase hover:underline" href={resolve('/')}>Home</a>
    <a class="uppercase hover:underline" href={resolve('/films')}>Films</a>
    <a class="uppercase hover:underline" href={resolve('/characters')}
      >Characters</a
    >
  </nav>
  <div class="p-2">
    {@render children()}
  </div>
  <SvelteQueryDevtools />
</QueryClientProvider>
