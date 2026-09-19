import { broadcastQueryClientRestore } from '@tanstack/query-broadcast-client-experimental'
import {
  IsRestoringProvider,
  QueryClientProvider,
  useIsRestoring,
} from '@tanstack/solid-query'
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import type { BroadcastQueryClientRestoreOptions } from '@tanstack/query-broadcast-client-experimental'
import type { JSX } from 'solid-js'
import type { QueryClientProviderProps } from '@tanstack/solid-query'

export type BroadcastQueryClientProviderProps = QueryClientProviderProps & {
  broadcastOptions: Omit<BroadcastQueryClientRestoreOptions, 'queryClient'>
}

export const BroadcastQueryClientProvider = (
  props: BroadcastQueryClientProviderProps,
): JSX.Element => {
  const parentIsRestoring = useIsRestoring()
  const [isRestoring, setIsRestoring] = createSignal(true)

  const options = createMemo(() => ({
    ...props.broadcastOptions,
    queryClient: props.client,
  }))

  createEffect(() => {
    setIsRestoring(true)
    let mounted = true
    const [cleanup, restorePromise] = broadcastQueryClientRestore(options())

    restorePromise.then(() => {
      if (mounted) {
        setIsRestoring(false)
      }
    })

    onCleanup(() => {
      mounted = false
      cleanup()
    })
  })

  return (
    <QueryClientProvider client={props.client}>
      <IsRestoringProvider value={() => parentIsRestoring() || isRestoring()}>
        {props.children}
      </IsRestoringProvider>
    </QueryClientProvider>
  )
}
