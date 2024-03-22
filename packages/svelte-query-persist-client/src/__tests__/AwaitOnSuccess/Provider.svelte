<script lang="ts">
  import PersistQueryClientProvider from '../../PersistQueryClientProvider.svelte'
  import AwaitOnSuccess from './AwaitOnSuccess.svelte'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import type { Writable } from 'svelte/store'

  export let queryClient: QueryClient
  export let persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
  export let key: Array<string>
  export let onSuccess: () => Promise<void>
  export let states: Writable<Array<string>>
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions} {onSuccess}>
  <AwaitOnSuccess {key} {states} />
</PersistQueryClientProvider>
