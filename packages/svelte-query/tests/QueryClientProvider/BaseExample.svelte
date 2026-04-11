<script lang="ts">
  import { QueryClientProvider } from '../../src/index.js'
  import QueryChild from './QueryChild.svelte'
  import type { QueryClient } from '@tanstack/query-core'

  type Props = {
    queryClient: QueryClient
  }

  let { queryClient }: Props = $props()
</script>

<QueryClientProvider client={queryClient}>
  <QueryChild />
</QueryClientProvider>
