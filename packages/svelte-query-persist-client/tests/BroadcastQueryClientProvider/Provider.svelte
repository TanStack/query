<script lang="ts">
  import BroadcastQueryClientProvider from '../../src/BroadcastQueryClientProvider.svelte'
  import Page from './Page.svelte'
  import type { QueryClient } from '@tanstack/svelte-query'

  let {
    queryClient,
    onFetch,
    staleTime = Infinity,
  }: {
    queryClient: QueryClient
    onFetch: () => void
    staleTime?: number
  } = $props()
</script>

<BroadcastQueryClientProvider
  client={queryClient}
  broadcastOptions={{ broadcastChannel: 'test-channel' }}
>
  <Page {onFetch} {staleTime} />
</BroadcastQueryClientProvider>
