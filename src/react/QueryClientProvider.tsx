import React from 'react'

import { QueryClient } from '../core'

const queryClientContext = React.createContext<QueryClient | undefined>(
  undefined
)

export const useQueryClient = () => React.useContext(queryClientContext)!

export interface QueryClientProviderProps {
  client: QueryClient
}

export const QueryClientProvider: React.FC<QueryClientProviderProps> = ({
  client,
  children,
}) => {
  React.useEffect(() => {
    client.mount()
    return () => {
      client.unmount()
    }
  }, [client])

  return (
    <queryClientContext.Provider value={client}>
      {children}
    </queryClientContext.Provider>
  )
}
