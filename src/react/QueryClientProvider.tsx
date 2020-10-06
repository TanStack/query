import React from 'react'

import { QueryClient } from '../core'

const QueryClientContext = React.createContext<QueryClient | undefined>(
  undefined
)

export const useQueryClient = () => React.useContext(QueryClientContext)!

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
    <QueryClientContext.Provider value={client}>
      {children}
    </QueryClientContext.Provider>
  )
}
