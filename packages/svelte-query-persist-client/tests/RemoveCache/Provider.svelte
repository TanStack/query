<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import RemoveCache from './RemoveCache.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'

  export let queryClient: QueryClient
  export let persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
  export let onSuccess: () => void
  export let onError: () => void
</script>

<PersistQueryClientProvider
  client={queryClient}
  {persistOptions}
  {onSuccess}
  {onError}
>
  <RemoveCache />
</PersistQueryClientProvider>
