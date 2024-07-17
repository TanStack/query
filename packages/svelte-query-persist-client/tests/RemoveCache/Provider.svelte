<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import RemoveCache from './RemoveCache.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'

  export let queryClient: QueryClient
  export let persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions}>
  <RemoveCache />
</PersistQueryClientProvider>
