import { getContext, setContext } from 'svelte'
import type { QueryClient } from '@tanstack/query-core'
import type { Box, ReactiveValue } from './containers.svelte'

const _contextKey = Symbol('QueryClient')

/** Retrieves a Client from Svelte's context */
export const getQueryClientContext = (): QueryClient => {
  const client = getContext<QueryClient | undefined>(_contextKey)
  if (!client) {
    throw new Error(
      'No QueryClient was found in Svelte context. Did you forget to wrap your component with QueryClientProvider?',
    )
  }

  return client
}

/** Sets a QueryClient on Svelte's context */
export const setQueryClientContext = (client: QueryClient): void => {
  setContext(_contextKey, client)
}

const _isRestoringContextKey = Symbol('isRestoring')

/** Retrieves a `isRestoring` from Svelte's context */
export const getIsRestoringContext = (): Box<boolean> => {
  try {
    const isRestoring = getContext<Box<boolean> | undefined>(
      _isRestoringContextKey,
    )
    return isRestoring ?? { current: false }
  } catch (error) {
    return { current: false }
  }
}

/** Sets a `isRestoring` on Svelte's context */
export const setIsRestoringContext = (isRestoring: Box<boolean>): void => {
  setContext(_isRestoringContextKey, isRestoring)
}
