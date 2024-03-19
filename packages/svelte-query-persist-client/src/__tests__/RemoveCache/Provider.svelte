<script lang="ts">
  import PersistQueryClientProvider from '../../PersistQueryClientProvider.svelte'
  import RemoveCache from './RemoveCache.svelte'
  import type { OmitKeyOf, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'

  export let queryClient: QueryClient
  export let persistOptions: OmitKeyOf<PersistQueryClientOptions, 'queryClient'>
  export let key: Array<string>
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions}>
  <RemoveCache {key} />
</PersistQueryClientProvider>
