import { getContext, setContext } from 'svelte'
import type { QueryClient } from '@tanstack/query-core'
import type { Box } from './containers.svelte'

const _contextKey = Symbol('QueryClient')

/**
 * Retrieves the `QueryClient` set on Svelte's context by `QueryClientProvider` (or by
 * {@link setQueryClientContext} directly). This is what {@link useQueryClient} calls internally.
 *
 * @throws If no `QueryClient` was found in context.
 * @returns The `QueryClient` from the nearest `QueryClientProvider`.
 */
export const getQueryClientContext = (): QueryClient => {
  const client = getContext<QueryClient | undefined>(_contextKey)
  if (!client) {
    throw new Error(
      'No QueryClient was found in Svelte context. Did you forget to wrap your component with QueryClientProvider?',
    )
  }

  return client
}

/**
 * Sets a `QueryClient` on Svelte's context, so it can be read with {@link getQueryClientContext} (or
 * {@link useQueryClient}) from any descendant component. `QueryClientProvider` wraps this — use it directly
 * only if you need to set the client from your own component instead.
 *
 * @param client - The `QueryClient` to make available to descendant components.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
 *
 *   const queryClient = new QueryClient()
 * </script>
 *
 * <QueryClientProvider client={queryClient}>
 *   <App />
 * </QueryClientProvider>
 * ```
 */
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
