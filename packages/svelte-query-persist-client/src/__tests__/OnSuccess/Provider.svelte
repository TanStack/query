<script lang="ts">
import PersistQueryClientProvider from '../../PersistQueryClientProvider.svelte'
import OnSuccess from './OnSuccess.svelte'
import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'
import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'

export let queryClient: QueryClient
export let persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
export let key: Array<string>
export let onSuccess: () => void
</script>

<PersistQueryClientProvider client={queryClient} {persistOptions} {onSuccess}>
  <OnSuccess {key} />
</PersistQueryClientProvider>
