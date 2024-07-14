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

  type PersistQueryClientProviderProps = QueryClientProviderProps & {
    persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
    onSuccess?: () => void
  }
  let {
    client,
    children,
    persistOptions,
    onSuccess,
    ...props
  }: PersistQueryClientProviderProps = $props()

  let isRestoring = $state(true)
  setIsRestoringContext(() => isRestoring)
  const refs = $derived({ persistOptions, onSuccess })
  let didRestore = $state(false)
  const options = $derived({
    ...persistOptions,
    queryClient: client,
  })

  $effect(() => {
    return isRestoring ? () => 1 : persistQueryClientSubscribe(options)
  })
  $effect(() => {
    isRestoring = true
    persistQueryClientRestore(options).then(() => {
      try {
        console.log('restoring !', typeof isRestoring)
        onSuccess?.()
      } finally {
        console.log('restored')
        isRestoring = false
      }
    })
  })
</script>

<QueryClientProvider {client} {...props}>
  {@render children?.()}
</QueryClientProvider>
