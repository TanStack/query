<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import QueryClientProvider from '../../src/QueryClientProvider.svelte'
  import ChildComponent from './ChildComponent.svelte'
  import type { QueryCache } from '@tanstack/query-core'

  export let queryCache: QueryCache

  const queryClient = new QueryClient({ queryCache })
</script>

<QueryClientProvider client={queryClient}>
  <ChildComponent />
</QueryClientProvider>
