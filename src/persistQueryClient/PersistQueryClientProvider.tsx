import React from 'react'

import { persistQueryClient, PersistQueryClientOptions } from './persist'
import { QueryClientProvider, QueryClientProviderProps } from '../reactjs'

export interface PersistQueryClientProviderProps
  extends QueryClientProviderProps {
  persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>
  loading?: React.ReactNode
}

export const PersistQueryClientProvider = ({
  client,
  loading,
  children,
  persistOptions,
  ...props
}: PersistQueryClientProviderProps): JSX.Element => {
  const [initialized, setInitialized] = React.useState(false)
  const options = React.useRef(persistOptions)
  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined

    async function run() {
      unsubscribe = await persistQueryClient({
        ...options.current,
        queryClient: client,
      })
      setInitialized(true)
    }

    void run()

    return unsubscribe
  }, [client])

  if (!initialized) {
    return <>{loading}</>
  }

  return (
    <QueryClientProvider client={client} {...props}>
      {children}
    </QueryClientProvider>
  )
}
