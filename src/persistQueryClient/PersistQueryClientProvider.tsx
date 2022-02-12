import React from 'react'

import { persistQueryClient, PersistQueryClientOptions } from './persist'
import { QueryClientProvider, QueryClientProviderProps } from '../reactjs'
import { IsHydratingProvider } from '../reactjs/Hydrate'

export interface PersistQueryClientProviderProps
  extends QueryClientProviderProps {
  persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>
  onSuccess?: () => void
  onError?: () => void
}

export const PersistQueryClientProvider = ({
  client,
  children,
  persistOptions,
  onSuccess,
  onError,
  ...props
}: PersistQueryClientProviderProps): JSX.Element => {
  const [isHydrating, setIsHydrating] = React.useState(true)
  const refs = React.useRef({ persistOptions, onSuccess, onError })

  React.useEffect(() => {
    refs.current = { persistOptions, onSuccess, onError }
  })

  React.useEffect(() => {
    const [unsubscribe, promise] = persistQueryClient({
      ...refs.current.persistOptions,
      queryClient: client,
    })

    promise
      .then(() => {
        refs.current.onSuccess?.()
        setIsHydrating(false)
      })
      .catch(() => {
        refs.current.onError?.()
        setIsHydrating(false)
      })

    return unsubscribe
  }, [client])

  return (
    <QueryClientProvider client={client} {...props}>
      <IsHydratingProvider value={isHydrating}>{children}</IsHydratingProvider>
    </QueryClientProvider>
  )
}
