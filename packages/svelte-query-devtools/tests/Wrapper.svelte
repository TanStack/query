<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import SvelteQueryDevtools from '../src/Devtools.svelte'
  import type { QueryClient } from '@tanstack/svelte-query'

  type Props = {
    queryClient: QueryClient
  }

  let { queryClient }: Props = $props()
</script>

<QueryClientProvider client={queryClient}>
  <SvelteQueryDevtools />
</QueryClientProvider>
