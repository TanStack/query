import * as React from 'react'

import type { QueryClient } from '@tanstack/query-core'
import type { ContextOptions } from './types'

export const defaultContext = React.createContext<QueryClient | undefined>(
  undefined,
)

function getQueryClientContext(
  context: React.Context<QueryClient | undefined> | undefined,
) {
  if (context) {
    return context
  }

  return defaultContext
}

export const useQueryClient = ({ context }: ContextOptions = {}) => {
  const queryClient = React.useContext(getQueryClientContext(context))

  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return queryClient
}

export type QueryClientProviderProps = {
  client: QueryClient
  children?: React.ReactNode
} & ContextOptions

export const QueryClientProvider = ({
  client,
  children,
  context,
}: QueryClientProviderProps): JSX.Element => {
  React.useEffect(() => {
    client.mount()
    return () => {
      client.unmount()
    }
  }, [client])

  const Context = getQueryClientContext(context)

  return <Context.Provider value={client}>{children}</Context.Provider>
}
