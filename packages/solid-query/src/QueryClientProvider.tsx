import type { QueryClient } from '@tanstack/query-core'
import type { Context, JSX } from 'solid-js'
import { createContext, useContext, onMount, onCleanup } from 'solid-js'
import type { ContextOptions } from './types'

export const defaultContext = createContext<QueryClient | undefined>(undefined)

function getQueryClientContext(
  context: Context<QueryClient | undefined> | undefined,
) {
  if (context) {
    return context
  }

  return defaultContext
}

export const useQueryClient = ({ context }: ContextOptions = {}) => {
  const queryClient = useContext(getQueryClientContext(context))

  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return queryClient
}

export type QueryClientProviderProps = {
  client: QueryClient
  children?: JSX.Element
} & ContextOptions

export const QueryClientProvider = (
  props: QueryClientProviderProps,
): JSX.Element => {
  onMount(() => {
    props.client.mount()
  })
  onCleanup(() => props.client.unmount())

  const QueryClientContext = getQueryClientContext(props.context)

  return (
    <QueryClientContext.Provider value={props.client}>
      {props.children}
    </QueryClientContext.Provider>
  )
}
