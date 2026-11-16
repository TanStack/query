<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import type { LayoutProps } from './$types'

  let { children }: LayoutProps = $props()

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
  <SvelteQueryDevtools />
</QueryClientProvider>
