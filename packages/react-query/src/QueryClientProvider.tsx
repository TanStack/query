'use client'
import * as React from 'react'

import { QueryClient } from '@tanstack/query-core'

export const QueryClientContext = React.createContext<QueryClient | undefined>(
  undefined,
)

export const useQueryClient = (queryClient?: QueryClient) => {
  const client = React.useContext(QueryClientContext)

  if (queryClient) {
    if (process.env.NODE_ENV !== 'production') {
      if (!(queryClient instanceof QueryClient)) {
        throw new Error(
          `useQueryClient got called with an invalid queryClient. This could be caused by a bad call of useQuery which since v5 accepts only one form of argument: an object. Please check error stack. More info here: https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#supports-a-single-signature-one-object`,
        )
      }
    }
    return queryClient
  }

  if (!client) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return client
}

export type QueryClientProviderProps = {
  client: QueryClient
  children?: React.ReactNode
}

export const QueryClientProvider = ({
  client,
  children,
}: QueryClientProviderProps): JSX.Element => {
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
