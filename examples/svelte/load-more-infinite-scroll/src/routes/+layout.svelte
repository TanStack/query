<script lang="ts">
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

<QueryClientProvider client={queryClient}>
  <main>
    {@render children()}
  </main>
  <SvelteQueryDevtools />
</QueryClientProvider>
