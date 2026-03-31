<script lang="ts">
  import { QueryClientProvider } from '../../src/index.js'
  import ChildComponent from './ChildComponent.svelte'
  import type { QueryClient } from '@tanstack/query-core'

  let { queryClient }: { queryClient: QueryClient } = $props()
</script>

<QueryClientProvider client={queryClient}>
  <ChildComponent />
</QueryClientProvider>
