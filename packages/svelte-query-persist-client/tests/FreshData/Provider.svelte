<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import FreshData from './FreshData.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import type { StatelessRef, StatusResult } from '../utils.svelte.js'

  interface Props {
    queryClient: QueryClient
    persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
    states: StatelessRef<Array<StatusResult<string>>>
    onFetch: () => void
  }

  let { queryClient, persistOptions, states, onFetch }: Props = $props()
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions}>
  <FreshData {states} {onFetch} />
</PersistQueryClientProvider>
