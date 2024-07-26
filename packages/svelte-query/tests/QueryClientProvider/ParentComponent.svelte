<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { QueryClientProvider } from '../../src/index.js'
  import ChildComponent from './ChildComponent.svelte'
  import type { QueryCache } from '@tanstack/query-core'

  let { queryCache }: { queryCache: QueryCache } = $props()

  const queryClient = new QueryClient({ queryCache })
</script>

<QueryClientProvider client={queryClient}>
  <ChildComponent />
</QueryClientProvider>
