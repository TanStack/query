import React from 'react'

import { QueryClient } from '../core'

declare global {
  interface Window {
    ReactQueryClientContext?: React.Context<QueryClient | undefined>
  }
}

const defaultContext = React.createContext<QueryClient | undefined>(undefined)

// We share the first and at least one
// instance of the context across the window
// to ensure that if React Query is used across
// different bundles or microfrontends they will
// all use the same **instance** of context, regardless
// of module scoping.
function getQueryClientContext() {
  // @ts-ignore (for global)
  if (typeof window !== 'undefined') {
    if (!window.ReactQueryClientContext) {
      window.ReactQueryClientContext = defaultContext
    }

    return window.ReactQueryClientContext
  }

  return defaultContext
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
