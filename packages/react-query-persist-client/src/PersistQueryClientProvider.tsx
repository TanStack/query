'use client'
import * as React from 'react'

import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import { IsRestoringProvider, QueryClientProvider } from '@tanstack/react-query'
import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
import type { OmitKeyof, QueryClientProviderProps } from '@tanstack/react-query'

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
 * before subscribing. Once restored, the client is saved with the persister whenever the cache
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
  const [isRestoring, setIsRestoring] = React.useState(true)
  const optionsRef = React.useRef({ persistOptions, onSuccess, onError })
  const didRestoreRef = React.useRef(false)

  React.useEffect(() => {
    optionsRef.current = { persistOptions, onSuccess, onError }
  })

  React.useEffect(() => {
    const options = {
      ...optionsRef.current.persistOptions,
      queryClient: props.client,
    }
    if (!didRestoreRef.current) {
      didRestoreRef.current = true
      persistQueryClientRestore(options)
        .then(() => optionsRef.current.onSuccess?.())
        .catch(() => optionsRef.current.onError?.())
        .finally(() => {
          setIsRestoring(false)
        })
    }
    return isRestoring ? undefined : persistQueryClientSubscribe(options)
  }, [props.client, isRestoring])

  return (
    <QueryClientProvider {...props}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  )
}
