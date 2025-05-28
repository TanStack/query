<script lang="ts">
  import { onDestroy } from 'svelte'
  import { persistQueryClient } from '@tanstack/query-persist-client-core'
  import {
    QueryClientProvider,
    setIsRestoringContext,
  } from '@tanstack/svelte-query'
  import { writable } from 'svelte/store'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import type { OmitKeyof, QueryClient } from '@tanstack/svelte-query'

  export let client: QueryClient
  export let onSuccess: () => MaybePromise<unknown> = () => undefined
  export let onError: () => MaybePromise<unknown> = () => undefined
  export let persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>

  const isRestoring = writable(true)
  setIsRestoringContext(isRestoring)
  $: {
    let isStale = false
    isRestoring.set(true)
    const [unsubscribe, promise] = persistQueryClient({
      ...persistOptions,
      queryClient: client,
    })
    promise
      .then(async () => {
        if (!isStale) {
          await onSuccess()
        }
      })
      .catch(async () => {
        if (!isStale) {
          await onError()
        }
      })
      .finally(() => {
        if (!isStale) {
          isRestoring.set(false)
        }
      })
    onDestroy(() => {
      isStale = true
      unsubscribe()
    })
  }
</script>

<QueryClientProvider {client}>
  <slot />
</QueryClientProvider>
