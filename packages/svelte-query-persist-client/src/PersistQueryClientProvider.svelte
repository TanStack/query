<script lang="ts">
  import {
    persistQueryClientRestore,
    persistQueryClientSubscribe,
  } from '@tanstack/query-persist-client-core'
  import {
    QueryClientProvider,
    setIsRestoringContext,
  } from '@tanstack/svelte-query'
  import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
  import type {
    OmitKeyof,
    QueryClientProviderProps,
  } from '@tanstack/svelte-query'
  import { box } from './utils.svelte.js'

  type PersistQueryClientProviderProps = QueryClientProviderProps & {
    persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
    onSuccess?: () => void
    onError?: () => void
  }

  let {
    client,
    children,
    persistOptions,
    ...props
  }: PersistQueryClientProviderProps = $props()

  let isRestoring = box(true)

  setIsRestoringContext(isRestoring)

  const options = $derived({
    ...persistOptions,
    queryClient: client,
  })

  $effect(() => {
    return isRestoring ? () => {} : persistQueryClientSubscribe(options)
  })

  $effect(() => {
    isRestoring.current = true
    persistQueryClientRestore(options)
      .then(() => props.onSuccess?.())
      .catch(() => props.onError?.())
      .finally(() => {
        isRestoring.current = false
      })
  })
</script>

<QueryClientProvider {client} {...props}>
  {@render children()}
</QueryClientProvider>
