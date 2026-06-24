<script lang="ts">
  import { QueryClientProvider } from '../../src/index.js'
  import Child from './Child.svelte'
  import type { QueryClient } from '@tanstack/query-core'

  type Props = {
    queryClient: QueryClient
  }

  let { queryClient }: Props = $props()
</script>

<QueryClientProvider client={queryClient}>
  <Child />
</QueryClientProvider>
