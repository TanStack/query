'use client'
import * as React from 'react'

import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import type { QueryClientProviderProps } from '@tanstack/react-query'
import { QueryClientProvider, IsRestoringProvider } from '@tanstack/react-query'

export type PersistQueryClientProviderProps = QueryClientProviderProps & {
  persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>
  onSuccess?: () => void
}

export const PersistQueryClientProvider = ({
  client,
  children,
  persistOptions,
  onSuccess,
  ...props
}: PersistQueryClientProviderProps): JSX.Element => {
  const [isRestoring, setIsRestoring] = React.useState(true)
  const refs = React.useRef({ persistOptions, onSuccess })

  React.useEffect(() => {
    refs.current = { persistOptions, onSuccess }
  })

  React.useEffect(() => {
    let isStale = false
    setIsRestoring(true)
    const [unsubscribe, promise] = persistQueryClient({
      ...refs.current.persistOptions,
      queryClient: client,
    })

    promise.then(() => {
      if (!isStale) {
        refs.current.onSuccess?.()
        setIsRestoring(false)
      }
    })

    return () => {
      isStale = true
      unsubscribe()
    }
  }, [client])

  return (
    <QueryClientProvider client={client} {...props}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  )
}
