import {
  createContext,
  createRenderEffect,
  onCleanup,
  useContext,
} from 'solid-js'
import type { QueryClient } from './QueryClient'
import type { Accessor, JSX } from 'solid-js'

/**
 * The context that `useQueryClient` reads from. `QueryClientProvider` is the normal way to set it.
 */
export const QueryClientContext = createContext<
  (() => QueryClient) | undefined
>(undefined)

const queryClientContextError =
  'No QueryClient set, use QueryClientProvider to set one'

/**
 * The `useQueryClient` hook returns the current `QueryClient` instance.
 *
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current `QueryClient` instance.
 * @throws If no `queryClient` argument is passed and no `QueryClientProvider` is found in the component tree.
 */
export const useQueryClient = (queryClient?: QueryClient) => {
  if (queryClient) {
    return queryClient
  }
  const client = useContext(QueryClientContext)

  if (!client) {
    throw new Error(queryClientContextError)
  }

  return client()
}

export const useQueryClientResolver = (
  queryClient?: Accessor<QueryClient | undefined>,
): Accessor<QueryClient> => {
  const contextClient = useContext(QueryClientContext)

  return () => {
    const resolvedClient = queryClient?.()
    if (resolvedClient) {
      return resolvedClient
    }

    if (!contextClient) {
      throw new Error(queryClientContextError)
    }

    return contextClient()
  }
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
   * The components that get access to the provided `QueryClient`.
   */
  children?: JSX.Element
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
 * import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
 *
 * const queryClient = new QueryClient()
 *
 * function App() {
 *   return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
 * }
 * ```
 */
export const QueryClientProvider = (
  props: QueryClientProviderProps,
): JSX.Element => {
  createRenderEffect<() => void>((unmount) => {
    unmount?.()
    props.client.mount()
    return props.client.unmount.bind(props.client)
  })
  onCleanup(() => props.client.unmount())

  return (
    <QueryClientContext.Provider value={() => props.client}>
      {props.children}
    </QueryClientContext.Provider>
  )
}
