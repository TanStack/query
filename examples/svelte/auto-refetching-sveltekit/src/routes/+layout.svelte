<script lang="ts">
  import '../app.css'
  import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import { browser } from '$app/environment'
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
  <title>TanStack Svelte Query Auto Refetching Example (SvelteKit)</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  <main>
    {@render children()}
  </main>
  <SvelteQueryDevtools />
</QueryClientProvider>
