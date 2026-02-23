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
  const refs = useRef({ persistOptions, onSuccess, onError })
  const didRestore = useRef(false)

  useEffect(() => {
    refs.current = { persistOptions, onSuccess, onError }
  })

  useEffect(() => {
    const options = {
      ...refs.current.persistOptions,
      queryClient: props.client,
    }
    if (!didRestore.current) {
      didRestore.current = true
      persistQueryClientRestore(options)
        .then(() => refs.current.onSuccess?.())
        .catch(() => refs.current.onError?.())
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
