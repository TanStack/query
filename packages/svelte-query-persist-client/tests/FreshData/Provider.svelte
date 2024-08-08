<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import FreshData from './FreshData.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import type { Writable } from 'svelte/store'
  import type { StatusResult } from '../utils.js'

  export let queryClient: QueryClient
  export let persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
  export let states: Writable<Array<StatusResult<string>>>
  export let fetched: Writable<boolean>
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions}>
  <FreshData {states} {fetched} />
</PersistQueryClientProvider>
