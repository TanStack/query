import React from 'react'

import { QueryClient } from '../core'

declare global {
  interface Window {
    ReactQueryClientContext?: React.Context<QueryClient | undefined>
  }
}

const defaultContext = React.createContext<QueryClient | undefined>(undefined)
const QueryClientSharingContext = React.createContext<boolean>(false)

// if contextSharing is on, we share the first and at least one
// instance of the context across the window
// to ensure that if React Query is used across
// different bundles or microfrontends they will
// all use the same **instance** of context, regardless
// of module scoping.
function getQueryClientContext(contextSharing: boolean) {
  if (contextSharing && typeof window !== 'undefined') {
    if (!window.ReactQueryClientContext) {
      window.ReactQueryClientContext = defaultContext
    }

    return window.ReactQueryClientContext
  }

  return defaultContext
}

export const useQueryClient = () => {
  const queryClient = React.useContext(
    getQueryClientContext(React.useContext(QueryClientSharingContext))
  )

  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return queryClient
}

export interface QueryClientProviderProps {
  client: QueryClient
  contextSharing?: boolean
}

export const QueryClientProvider: React.FC<QueryClientProviderProps> = ({
  client,
  contextSharing = false,
  children,
}) => {
  React.useEffect(() => {
    client.mount()
    return () => {
      client.unmount()
    }
  }, [client])

  const Context = getQueryClientContext(contextSharing)

  return (
    <QueryClientSharingContext.Provider value={contextSharing}>
      <Context.Provider value={client}>{children}</Context.Provider>
    </QueryClientSharingContext.Provider>
  )
}
