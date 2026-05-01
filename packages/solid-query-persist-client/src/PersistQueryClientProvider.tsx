import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { IsRestoringContext, QueryClientProvider } from '@tanstack/solid-query'
import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
import type { OmitKeyof, QueryClientProviderProps } from '@tanstack/solid-query'
import type { JSX } from '@solidjs/web'

export type PersistQueryClientProviderProps = QueryClientProviderProps & {
  persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
  onSuccess?: () => void
  onError?: () => void
}

export const PersistQueryClientProvider = (
  props: PersistQueryClientProviderProps,
): JSX.Element => {
  const [isRestoring, setIsRestoring] = createSignal(true)
  let didRestore = false

  const options = createMemo(() => ({
    ...props.persistOptions,
    queryClient: props.client,
  }))

  createEffect(
    () => {
      const opts = options()
      if (!didRestore) {
        didRestore = true
        persistQueryClientRestore(opts)
          .then(() => props.onSuccess?.())
          .catch(() => props.onError?.())
          .finally(() => {
            setIsRestoring(false)
          })
      }
    },
    () => {},
  )

  createEffect(
    () => {
      let unsubscribe = () => {}
      if (!isRestoring()) {
        unsubscribe = persistQueryClientSubscribe(options())
      }
      onCleanup(() => unsubscribe())
    },
    () => {},
  )

  return (
    <QueryClientProvider client={props.client}>
      <IsRestoringContext value={isRestoring}>
        {props.children}
      </IsRestoringContext>
    </QueryClientProvider>
  )
}
