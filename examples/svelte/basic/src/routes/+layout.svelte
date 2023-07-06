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

<QueryClientProvider client={queryClient}>
  <main>
    <slot />
  </main>
  <SvelteQueryDevtools />
</QueryClientProvider>
