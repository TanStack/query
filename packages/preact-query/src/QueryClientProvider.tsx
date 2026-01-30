import type { QueryClient } from '@tanstack/query-core'
import { createContext } from 'preact'
import type {ComponentChildren, VNode} from 'preact'
import { useContext, useEffect } from 'preact/hooks'

export const QueryClientContext = createContext<QueryClient | undefined>(
  undefined,
)

export const useQueryClient = (queryClient?: QueryClient) => {
  const client = useContext(QueryClientContext)

  if (queryClient) {
    return queryClient
  }

  if (!client) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return client
}

export type QueryClientProviderProps = {
  client: QueryClient
  children?: ComponentChildren
}

export const QueryClientProvider = ({
  client,
  children,
}: QueryClientProviderProps): VNode => {
  useEffect(() => {
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
