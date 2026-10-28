<script lang="ts">
  import { browser } from '$app/environment'
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
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
  <title>TanStack Query Svelte Pagination Example</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  {@render children()}
  <SvelteQueryDevtools initialIsOpen />
</QueryClientProvider>
