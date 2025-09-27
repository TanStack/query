<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { QueryClientProvider } from '../src/index.js'
  import { Snippet } from 'svelte'

  const {
    queryClient = new QueryClient(),
    children,
  }: { queryClient?: QueryClient; children: Snippet } = $props()
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
