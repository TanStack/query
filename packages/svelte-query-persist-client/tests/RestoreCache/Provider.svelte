<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import RestoreCache from './RestoreCache.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import type { Writable } from 'svelte/store'
  import type { StatusResult } from '../utils'

  export let queryClient: QueryClient
  export let persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
  export let states: Writable<Array<StatusResult<string>>>
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions}>
  <RestoreCache {states} />
</PersistQueryClientProvider>
