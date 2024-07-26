<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import FreshData from './FreshData.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import type { StatusResult } from '../utils.svelte.js'

  interface Props {
    queryClient: QueryClient
    persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
    states: { value: Array<StatusResult<string>> }
    fetched: boolean
  }

  let { queryClient, persistOptions, states, fetched }: Props = $props()
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions}>
  <FreshData {states} {fetched} />
</PersistQueryClientProvider>
