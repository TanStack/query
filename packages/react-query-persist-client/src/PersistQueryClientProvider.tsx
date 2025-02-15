'use client'
import * as React from 'react'

import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import { IsRestoringProvider, QueryClientProvider } from '@tanstack/react-query'
import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
import type { OmitKeyof, QueryClientProviderProps } from '@tanstack/react-query'

export type PersistQueryClientProviderProps = QueryClientProviderProps & {
  persistOptions: OmitKeyof<PersistQueryClientOptions, 'queryClient'>
  onSuccess?: () => Promise<unknown> | unknown
}

export const PersistQueryClientProvider = ({
  client,
  children,
  persistOptions,
  onSuccess,
  ...props
}: PersistQueryClientProviderProps): React.JSX.Element => {
  const [isRestoring, setIsRestoring] = React.useState(true)
  const refs = React.useRef({ persistOptions, onSuccess })
  const didRestore = React.useRef(false)

  React.useEffect(() => {
    refs.current = { persistOptions, onSuccess }
  })

  React.useEffect(() => {
    const options = {
      ...refs.current.persistOptions,
      queryClient: client,
    }
    if (!didRestore.current) {
      didRestore.current = true
      persistQueryClientRestore(options).then(async () => {
        try {
          await refs.current.onSuccess?.()
        } finally {
          setIsRestoring(false)
        }
      })
    }
    return isRestoring ? undefined : persistQueryClientSubscribe(options)
  }, [client, isRestoring])

  return (
    <QueryClientProvider client={client} {...props}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  )
}
