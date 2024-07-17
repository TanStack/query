<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import RemoveCache from './RemoveCache.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'

  interface Props {
    queryClient: QueryClient
    persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
    key: Array<string>
  }

  let { queryClient, persistOptions, key }: Props = $props()
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions}>
  <RemoveCache />
</PersistQueryClientProvider>
