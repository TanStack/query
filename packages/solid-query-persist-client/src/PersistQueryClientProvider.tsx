import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
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

  const options = createMemo(() => ({
    ...props.persistOptions,
    queryClient: props.client,
  }))

  createEffect(() => {
    setIsRestoring(true)
    persistQueryClientRestore(options()).then(async () => {
      try {
        await props.onSuccess?.()
      } finally {
        setIsRestoring(false)
      }
    })
  })

  createEffect(() => {
    let unsubscribe = () => {}
    if (!isRestoring()) {
      unsubscribe = persistQueryClientSubscribe(options())
    }
    onCleanup(() => unsubscribe())
  })

  return (
    <QueryClientProvider client={props.client}>
      <IsRestoringProvider value={isRestoring}>
        {props.children}
      </IsRestoringProvider>
    </QueryClientProvider>
  )
}
