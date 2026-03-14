import {
  createContext,
  onCleanup,
  useContext,
} from 'solid-js'
import type { QueryClient } from './QueryClient'
import type { JSX } from 'solid-js'

export const QueryClientContext = createContext<
  (() => QueryClient) | undefined
>(undefined)

export const useQueryClient = (queryClient?: QueryClient) => {
  if (queryClient) {
    return queryClient
  }
  const client = useContext(QueryClientContext)

  if (!client) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return client()
}

export type QueryClientProviderProps = {
  client: QueryClient
  children?: JSX.Element
}

export const QueryClientProvider = (
  props: QueryClientProviderProps,
): JSX.Element => {
  onCleanup(() => props.client.unmount())

  return (
    <QueryClientContext value={() => props.client}>
      {props.children}
    </QueryClientContext>
  )
}
