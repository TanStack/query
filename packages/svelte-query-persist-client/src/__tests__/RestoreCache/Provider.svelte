<script lang="ts">
  import PersistQueryClientProvider from '../../PersistQueryClientProvider.svelte'
  import RestoreCache from './RestoreCache.svelte'
  import type { QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import type { Writable } from 'svelte/store'
  import type { StatusResult } from '../utils'

  export let queryClient: QueryClient
  export let persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>
  export let key: Array<string>
  export let states: Writable<Array<StatusResult<string>>>
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions}>
  <RestoreCache {key} {states} />
</PersistQueryClientProvider>
