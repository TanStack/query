<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import RestoreCache from './RestoreCache.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import type { StatusResult } from '../utils'

  export let queryClient: QueryClient
  export let persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
  export let key: Array<string>
  export let states: Array<StatusResult<string>>
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions}>
  <RestoreCache {key} {states} />
</PersistQueryClientProvider>
