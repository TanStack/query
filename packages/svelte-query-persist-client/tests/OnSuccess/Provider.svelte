<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import OnSuccess from './OnSuccess.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'

  interface Props {
    queryClient: QueryClient
    persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
    onSuccess: () => void
  }

  let { queryClient, persistOptions, onSuccess }: Props = $props()
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions} {onSuccess}>
  <OnSuccess />
</PersistQueryClientProvider>
