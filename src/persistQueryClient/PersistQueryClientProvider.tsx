import React from 'react'

import { persistQueryClient, PersistQueryClientOptions } from './persist'
import {
  QueryClientProvider,
  QueryClientProviderProps,
  IsHydratingProvider,
} from '../reactjs'

export interface PersistQueryClientProviderProps
  extends QueryClientProviderProps {
  persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>
}

export const PersistQueryClientProvider = ({
  client,
  children,
  persistOptions,
  ...props
}: PersistQueryClientProviderProps): JSX.Element => {
  const [isHydrating, setIsHydrating] = React.useState(true)
  const options = React.useRef(persistOptions)
  React.useEffect(() => {
    const [unsubscribe, promise] = persistQueryClient({
      ...options.current,
      queryClient: client,
    })

    promise.then(() => {
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
