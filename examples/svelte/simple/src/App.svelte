<script lang="ts">
import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query'
import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
import Simple from './lib/Simple.svelte'

const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  <main>
    <Simple />
  </main>
  <SvelteQueryDevtools />
</QueryClientProvider>
