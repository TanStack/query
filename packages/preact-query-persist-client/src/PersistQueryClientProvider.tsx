import { useEffect, useRef, useState } from 'preact/hooks'
import type { VNode } from 'preact'

import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import {
  IsRestoringProvider,
  QueryClientProvider,
} from '@tanstack/preact-query'
import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
import type {
  OmitKeyof,
  QueryClientProviderProps,
} from '@tanstack/preact-query'

/**
 * The props of `PersistQueryClientProvider`: the props of `QueryClientProvider`, plus the
 * `persistOptions` and callbacks for when restoring succeeds or fails.
 */
export type PersistQueryClientProviderProps = QueryClientProviderProps & {
  persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
  onSuccess?: () => Promise<unknown> | unknown
  onError?: () => Promise<unknown> | unknown
}

export const PersistQueryClientProvider = ({
  children,
  persistOptions,
  onSuccess,
  onError,
  ...props
}: PersistQueryClientProviderProps): VNode => {
  const [isRestoring, setIsRestoring] = useState(true)
  const optionsRef = useRef({ persistOptions, onSuccess, onError })
  const didRestoreRef = useRef(false)

  useEffect(() => {
    optionsRef.current = { persistOptions, onSuccess, onError }
  })

  useEffect(() => {
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
