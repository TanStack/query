<script lang="ts">
  import PersistQueryClientProvider from '../../PersistQueryClientProvider.svelte'
  import InitialData from './InitialData.svelte'
  import type { OmitKeyOf, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import type { Writable } from 'svelte/store'
  import type { StatusResult } from '../utils'

  export let queryClient: QueryClient
  export let persistOptions: OmitKeyOf<PersistQueryClientOptions, 'queryClient'>
  export let key: Array<string>
  export let states: Writable<Array<StatusResult<string>>>
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions}>
  <InitialData {key} {states} />
</PersistQueryClientProvider>
