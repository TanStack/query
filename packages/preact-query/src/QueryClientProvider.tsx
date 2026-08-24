import type { QueryClient } from '@tanstack/query-core'
import { createContext } from 'preact'
import type { ComponentChildren, VNode } from 'preact'
import { useContext, useEffect } from 'preact/hooks'

export const QueryClientContext = createContext<QueryClient | undefined>(
  undefined,
)

/**
 * The `useQueryClient` hook returns the current `QueryClient` instance.
 *
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 */
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
  /**
   * **Required**
   *
   * The QueryClient instance to provide.
   */
  client: QueryClient
  children?: ComponentChildren
}

/**
 * Use the `QueryClientProvider` component to connect and provide a `QueryClient` to your application.
 *
 * @example
 * ```tsx
 * import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
 *
 * const queryClient = new QueryClient()
 *
 * function App() {
 *   return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
 * }
 * ```
 */
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
