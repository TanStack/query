<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import AwaitOnSuccess from './AwaitOnSuccess.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import { StatelessRef } from '../utils.svelte'

  interface Props {
    queryClient: QueryClient
    persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
    onSuccess: () => Promise<void>
    states: StatelessRef<Array<string>>
  }

  let { queryClient, persistOptions, onSuccess, states }: Props = $props()
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions} {onSuccess}>
  <AwaitOnSuccess {states} />
</PersistQueryClientProvider>
