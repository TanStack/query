import type { QueryClient } from '@tanstack/query-core'

declare global {
  interface Window {
    '@QUERY_CLIENT_ab1518dc-44cd-45c2-807d-7b28c9200145':
      | QueryClient
      | undefined
  }
}
/**
 * The unique identifier for the QueryClient instance in the window object.
 * It is used to store the QueryClient instance in the window object.
 */
export const QUERY_CLIENT_ID =
  '@QUERY_CLIENT_ab1518dc-44cd-45c2-807d-7b28c9200145'

/**
 * A utility function that sets an instance of the QueryClient.
 * It should be called at the top level of the application.
 * It also mounts the QueryClient, starting it to manage queries.
 * @param client The QueryClient instance to set.
 */
export const setQueryClient = (client: QueryClient): void => {
  client.mount()
  window[QUERY_CLIENT_ID] = client
}

/**
 * A utility function that returns an instance of the QueryClient.
 * Make sure that setQueryClient has been called before calling this function.
 * It should be called at the top level of the application.
 * @returns The QueryClient instance.
 */
export const getQueryClient = (): QueryClient => {
  const client = window[QUERY_CLIENT_ID]
  if (!client) {
    throw new Error('QueryClient is not set. Please call setQueryClient first.')
  }
  return client
}

/**
 * Unmounts the QueryClient, stopping it from managing queries.
 */
export const unmountQueryClient = () => {
  const client = getQueryClient()
  client.unmount()
  window[QUERY_CLIENT_ID] = undefined
}
