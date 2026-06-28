import {
  createContext,
  createRenderEffect,
  onCleanup,
  useContext,
} from 'solid-js'
import type { QueryClient } from './QueryClient'
import type { Accessor, JSX } from 'solid-js'

export const QueryClientContext = createContext<
  (() => QueryClient) | undefined
>(undefined)

const queryClientContextError =
  'No QueryClient set, use QueryClientProvider to set one'

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

export type QueryClientProviderProps = {
  client: QueryClient
  children?: JSX.Element
}

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
