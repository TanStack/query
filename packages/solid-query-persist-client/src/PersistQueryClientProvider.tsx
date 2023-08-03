import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createEffect, createSignal } from 'solid-js'
import { IsRestoringProvider, QueryClientProvider } from '@tanstack/solid-query'
import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
import type { QueryClientProviderProps } from '@tanstack/solid-query'
import type { JSX } from 'solid-js'

export type PersistQueryClientProviderProps = QueryClientProviderProps & {
  persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>
  onSuccess?: () => void
}

export const PersistQueryClientProvider = (props: PersistQueryClientProviderProps): JSX.Element => {
  const [isRestoring, setIsRestoring] = createSignal(true)
  const refs = () => ({ persistOptions: props.persistOptions, onSuccess: props.onSuccess })

  createEffect<() => void>((cleanup) => {
    cleanup?.();
    let isStale = false
    setIsRestoring(true)
    const [unsubscribe, promise] = persistQueryClient({
      ...refs().persistOptions,
      queryClient: props.client,
    })

    promise.then(() => {
      if (!isStale) {
        refs().onSuccess?.()
        setIsRestoring(false)
      }
    })

    return () => {
      isStale = true
      unsubscribe()
    }
  })

  return (
    <QueryClientProvider {...props} client={props.client}>
      <IsRestoringProvider value={isRestoring}>{props.children}</IsRestoringProvider>
    </QueryClientProvider>
  )
}
