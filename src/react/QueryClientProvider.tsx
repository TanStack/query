import React from 'react'

import { QueryClient } from '../core'

const QueryClientContext = (() => {
  const context = React.createContext<QueryClient | undefined>(undefined)
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.ReactQueryClientContext = context
  }
  return context
})()

function getQueryClientContext() {
  return typeof window !== 'undefined'
    ? // @ts-ignore
      (window.ReactQueryClientContext as React.Context<
        QueryClient | undefined
      >) ?? QueryClientContext
    : QueryClientContext
}

export const useQueryClient = () => {
  const queryClient = React.useContext(getQueryClientContext())

  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return queryClient
}

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

  const Context = getQueryClientContext()

  return <Context.Provider value={client}>{children}</Context.Provider>
}
