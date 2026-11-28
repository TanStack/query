'use client'
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import { IsRestoringProvider, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
import type {
  OmitKeyof,
  QueryClient,
  QueryClientProviderProps,
} from '@tanstack/react-query'

/**
 * The props of `PersistQueryClientProvider`: the props of `QueryClientProvider`, plus the
 * `persistOptions` and callbacks for when restoring succeeds or fails.
 */
export type PersistQueryClientProviderProps = QueryClientProviderProps & {
  persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
  onSuccess?: () => Promise<unknown> | unknown
  onError?: () => Promise<unknown> | unknown
}

/**
 * Provides the `QueryClient` like `QueryClientProvider`, and restores the persisted client first:
 * while restoring, `useIsRestoring` returns `true` and queries wait for the restore to finish
 * before subscribing. Switching clients restores the new client before its queries subscribe. Once restored, the client is saved with the persister whenever the cache
 * changes.
 * @param props - The `QueryClientProvider` props, the `persistOptions`, and the `onSuccess` and
 * `onError` callbacks. `onSuccess` is called once restoring finishes, even if nothing was restored
 * (e.g. because the persisted client expired), and `onError` if restoring or `onSuccess` throws.
 * @returns The `QueryClientProvider` wrapping the children.
 */
export const PersistQueryClientProvider = ({
  children,
  persistOptions,
  onSuccess,
  onError,
  ...props
}: PersistQueryClientProviderProps): React.JSX.Element => {
  const [restoredClient, setRestoredClient] = React.useState<QueryClient>()
  const isRestoring = restoredClient !== props.client
  const optionsRef = React.useRef({ persistOptions, onSuccess, onError })
  const restoreRef = React.useRef<{
    client: QueryClient
    promise: Promise<void>
  }>(undefined)

  React.useEffect(() => {
    optionsRef.current = { persistOptions, onSuccess, onError }
  })

  React.useEffect(() => {
    const options = {
      ...optionsRef.current.persistOptions,
      queryClient: props.client,
    }
    if (!isRestoring) return persistQueryClientSubscribe(options)
    if (restoreRef.current?.client !== props.client) {
      restoreRef.current = {
        client: props.client,
        promise: persistQueryClientRestore(options),
      }
    }
    let current = true
    restoreRef.current.promise
      .then(() => current && optionsRef.current.onSuccess?.())
      .catch(() => current && optionsRef.current.onError?.())
      .finally(() => {
        if (current) setRestoredClient(props.client)
      })
    return () => {
      current = false
    }
  }, [props.client, isRestoring])

  return (
    <QueryClientProvider {...props}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  )
}
