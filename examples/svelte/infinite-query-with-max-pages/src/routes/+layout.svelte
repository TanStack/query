<script lang="ts">
  import { browser } from '$app/environment'
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
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
  <title>TanStack Query Svelte Infinite Query With Max Pages Example</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  {@render children()}
  <SvelteQueryDevtools initialIsOpen />
</QueryClientProvider>
