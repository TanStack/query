import * as React from 'react'

import type { QueryClient } from '@tanstack/query-core'
import type { ContextOptions } from './types'

declare global {
  interface Window {
    ReactQueryClientContext?: React.Context<QueryClient | undefined>
  }
}

export const defaultContext = React.createContext<QueryClient | undefined>(
  undefined,
)
const QueryClientSharingContext = React.createContext<boolean>(false)

// If we are given a context, we will use it.
// Otherwise, if contextSharing is on, we share the first and at least one
// instance of the context across the window
// to ensure that if React Query is used across
// different bundles or microfrontends they will
// all use the same **instance** of context, regardless
// of module scoping.
function getQueryClientContext(
  context: React.Context<QueryClient | undefined> | undefined,
  contextSharing: boolean,
) {
  if (context) {
    return context
  }
  if (contextSharing && typeof window !== 'undefined') {
    if (!window.ReactQueryClientContext) {
      window.ReactQueryClientContext = defaultContext
    }

    return window.ReactQueryClientContext
  }

  return defaultContext
}

export const useQueryClient = ({ context }: ContextOptions = {}) => {
  const queryClient = React.useContext(
    getQueryClientContext(context, React.useContext(QueryClientSharingContext)),
  )

  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return queryClient
}

type QueryClientProviderPropsBase = {
  client: QueryClient
  children?: React.ReactNode
}
type QueryClientProviderPropsWithContext = ContextOptions & {
  contextSharing?: never
} & QueryClientProviderPropsBase
type QueryClientProviderPropsWithContextSharing = {
  context?: never
  contextSharing?: boolean
} & QueryClientProviderPropsBase

export type QueryClientProviderProps =
  | QueryClientProviderPropsWithContext
  | QueryClientProviderPropsWithContextSharing

export const QueryClientProvider = ({
  client,
  children,
  context,
  contextSharing = false,
}: QueryClientProviderProps): JSX.Element => {
  React.useEffect(() => {
    client.mount()
    return () => {
      client.unmount()
    }
  }, [client])

  if (process.env.NODE_ENV !== 'production' && contextSharing) {
    client
      .getLogger()
      .error(
        `The contextSharing option has been deprecated and will be removed in the next major version`,
      )
  }

  const Context = getQueryClientContext(context, contextSharing)

  return (
    <QueryClientSharingContext.Provider value={!context && contextSharing}>
      <Context.Provider value={client}>{children}</Context.Provider>
    </QueryClientSharingContext.Provider>
  )
}
