import { getContext, setContext } from 'svelte'
import type { QueryClient } from '@tanstack/query-core'

const _contextKey = '$$_queryClient'

/** Retrieves a Client from Svelte's context */
export const getQueryClientContext = (): QueryClient => {
  const client = getContext(_contextKey)
  if (!client) {
    throw new Error(
      'No QueryClient was found in Svelte context. Did you forget to wrap your component with QueryClientProvider?',
    )
  }

  return client as QueryClient
}

/** Sets a QueryClient on Svelte's context */
export const setQueryClientContext = (client: QueryClient): void => {
  setContext(_contextKey, client)
}

const _isRestoringContextKey = '$$_isRestoring'

/** Retrieves a `isRestoring` from Svelte's context */
export const getIsRestoringContext = (): (() => boolean) => {
  try {
    const isRestoring = getContext<(() => boolean) | undefined>(
      _isRestoringContextKey,
    )
    return isRestoring ?? (() => false)
  } catch (error) {
    return () => false
  }
}

/** Sets a `isRestoring` on Svelte's context */
export const setIsRestoringContext = (isRestoring: () => boolean): void => {
  setContext(_isRestoringContextKey, isRestoring)
}
