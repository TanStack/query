import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createComputed, createSignal, onCleanup } from 'solid-js'
import { IsRestoringProvider, QueryClientProvider } from '@tanstack/solid-query'
import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
import type { QueryClientProviderProps } from '@tanstack/solid-query'
import type { JSX } from 'solid-js'

export type PersistQueryClientProviderProps = QueryClientProviderProps & {
  persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>
  onSuccess?: () => void
}

export const PersistQueryClientProvider = (
  props: PersistQueryClientProviderProps,
): JSX.Element => {
  const [isRestoring, setIsRestoring] = createSignal(true)

  let unsub: undefined | (() => void)
  createComputed<() => void>((cleanup) => {
    cleanup?.()
    let isStale = false
    setIsRestoring(true)
    const [unsubscribe, promise] = persistQueryClient({
      ...props.persistOptions,
      queryClient: props.client,
    })

    promise.then(async () => {
      if (isStale) return
      try {
        await props.onSuccess?.()
      } finally {
        setIsRestoring(false)
      }
    })

    unsub = () => {
      isStale = true
      unsubscribe()
    }
    return unsub
  })

  onCleanup(() => unsub?.())
  return (
    <QueryClientProvider client={props.client}>
      <IsRestoringProvider value={isRestoring}>
        {props.children}
      </IsRestoringProvider>
    </QueryClientProvider>
  )
}
