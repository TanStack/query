// based on react-query-persist-client/src/PersistQueryClientProvider.tsx

import { createSignal, onMount, onCleanup, mergeProps } from 'solid-js'

import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import type { QueryClientProviderProps } from '@tanstack/solid-query'
import { QueryClientProvider, IsRestoringProvider } from '@tanstack/solid-query'

export type PersistQueryClientProviderProps = QueryClientProviderProps & {
  persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>
  onSuccess?: () => void
}

export const PersistQueryClientProvider = (
  props: PersistQueryClientProviderProps,
) => {
  const mergedProps = mergeProps(
    {
      contextSharing: false,
    },
    props,
  )

  const [isRestoring, setIsRestoring] = createSignal(true)

  let isStale = false

  const [unsubscribe, restorePromise] = persistQueryClient({
    ...mergedProps.persistOptions,
    queryClient: mergedProps.client,
  })

  restorePromise.then(() => {
    if (!isStale) {
      mergedProps.onSuccess?.()
      setIsRestoring(false)
    }
  })

  onMount(() => mergedProps.client.mount())

  onCleanup(() => {
    mergedProps.client.unmount()

    isStale = true
    unsubscribe()
  })

  return (
    <QueryClientProvider client={mergedProps.client}>
      <IsRestoringProvider value={isRestoring}>
        {mergedProps.children}
      </IsRestoringProvider>
    </QueryClientProvider>
  )
}
