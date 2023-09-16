'use client'
import * as React from 'react'

import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { IsRestoringProvider, QueryClientProvider } from '@tanstack/react-query'
import type { PersistQueryClientOptions } from '@tanstack/query-persist-client-core'
import type { QueryClientProviderProps } from '@tanstack/react-query'

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
  const didRestore = React.useRef(false)

  React.useEffect(() => {
    refs.current = { persistOptions, onSuccess }
  })

  React.useEffect(() => {
    if (!didRestore.current) {
      didRestore.current = true
      setIsRestoring(true)
      const [unsubscribe, promise] = persistQueryClient({
        ...refs.current.persistOptions,
        queryClient: client,
      })

      promise.then(() => {
        refs.current.onSuccess?.()
        setIsRestoring(false)
      })

      return () => {
        unsubscribe()
      }
    }
    return undefined
  }, [client])

  return (
    <QueryClientProvider client={client} {...props}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  )
}
