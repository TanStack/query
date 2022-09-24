import type { QueryClient } from '@tanstack/query-core'
import type { Context, JSX } from 'solid-js'
import {
  createContext,
  useContext,
  onMount,
  onCleanup,
  mergeProps,
} from 'solid-js'
import type { ContextOptions } from './types'

declare global {
  interface Window {
    SolidQueryClientContext?: Context<QueryClient | undefined>
  }
}

export const defaultContext = createContext<QueryClient | undefined>(undefined)
const QueryClientSharingContext = createContext<boolean>(false)

// If we are given a context, we will use it.
// Otherwise, if contextSharing is on, we share the first and at least one
// instance of the context across the window
// to ensure that if Solid Query is used across
// different bundles or microfrontends they will
// all use the same **instance** of context, regardless
// of module scoping.
function getQueryClientContext(
  context: Context<QueryClient | undefined> | undefined,
  contextSharing: boolean,
) {
  if (context) {
    return context
  }
  if (contextSharing && typeof window !== 'undefined') {
    if (!window.SolidQueryClientContext) {
      window.SolidQueryClientContext = defaultContext
    }

    return window.SolidQueryClientContext
  }

  return defaultContext
}

export const useQueryClient = ({ context }: ContextOptions = {}) => {
  const queryClient = useContext(
    getQueryClientContext(context, useContext(QueryClientSharingContext)),
  )

  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return queryClient
}

type QueryClientProviderPropsBase = {
  client: QueryClient
  children?: JSX.Element
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

export const QueryClientProvider = (
  props: QueryClientProviderProps,
): JSX.Element => {
  const mergedProps = mergeProps(
    {
      contextSharing: false,
    },
    props,
  )
  onMount(() => mergedProps.client.mount())
  onCleanup(() => mergedProps.client.unmount())

  const QueryClientContext = getQueryClientContext(
    mergedProps.context,
    mergedProps.contextSharing,
  )

  return (
    <QueryClientSharingContext.Provider
      value={!mergedProps.context && mergedProps.contextSharing}
    >
      <QueryClientContext.Provider value={mergedProps.client}>
        {mergedProps.children}
      </QueryClientContext.Provider>
    </QueryClientSharingContext.Provider>
  )
}
