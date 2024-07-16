<script lang="ts">
  import PersistQueryClientProvider from '../../src/PersistQueryClientProvider.svelte'
  import AwaitOnSuccess from './AwaitOnSuccess.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'

  export let queryClient: QueryClient
  export let persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
  export let key: Array<string>
  export let onSuccess: () => Promise<void>
  export let states: Array<string>
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions} {onSuccess}>
  <AwaitOnSuccess {key} {states} />
</PersistQueryClientProvider>
