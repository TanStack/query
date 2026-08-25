import type { QueryClient } from '@tanstack/query-core'
import { createContext } from 'preact'
import type { ComponentChildren, VNode } from 'preact'
import { useContext, useEffect } from 'preact/hooks'

/**
 * The context that `useQueryClient` reads from. `QueryClientProvider` is the normal way to set it.
 */
export const QueryClientContext = createContext<QueryClient | undefined>(
  undefined,
)

/**
 * The `useQueryClient` hook returns the current `QueryClient` instance.
 *
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current `QueryClient` instance.
 * @throws If no `queryClient` argument is passed and no `QueryClientProvider` is found in the component tree.
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

/**
 * The props accepted by `QueryClientProvider`.
 */
export type QueryClientProviderProps = {
  /**
   * **Required**
   *
   * The `QueryClient` instance to provide.
   */
  client: QueryClient
  /**
   * The components that get access to the provided QueryClient.
   */
  children?: ComponentChildren
}

/**
 * Use the `QueryClientProvider` component to connect and provide a `QueryClient` to your application. Also
 * calls `client.mount()`/`client.unmount()` as this component mounts/unmounts, which subscribes the client to
 * focus/online events (resuming any paused mutations and refetching as needed when the app regains focus or
 * comes back online).
 *
 * @returns The provided `children`, wrapped so they can read the `QueryClient` via `useQueryClient`.
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
