<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import RestoreCache from './RestoreCache.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import type { StatusResult } from '../utils'

  interface Props {
    queryClient: QueryClient
    persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
    key: Array<string>
    states: Array<StatusResult<string>>
  }

  let {
    queryClient,
    persistOptions,
    key,
    states = $bindable(),
  }: Props = $props()
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions}>
  <RestoreCache {key} bind:states />
</PersistQueryClientProvider>
