<script lang="ts">
  import '../app.css'
  import { browser } from '$app/environment'
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
  <title
    >TanStack Svelte Query Load-More Infinite Scroll Example (SvelteKit)</title
  >
</svelte:head>

<QueryClientProvider client={queryClient}>
  <main>
    {@render children()}
  </main>
  <SvelteQueryDevtools />
</QueryClientProvider>
