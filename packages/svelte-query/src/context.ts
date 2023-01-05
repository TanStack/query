import { onMount, setContext, getContext } from 'svelte'
import { QueryClient, type QueryClientConfig } from '@tanstack/query-core'

const _contextKey = '$$_queryClient'

/** Retrieves a Client from Svelte's context */
export const getQueryClientContext = (): QueryClient => {
  const client = getContext(_contextKey)
  if (!client) {
    throw new Error(
      'No QueryClient was found in Svelte context. Did you forget to call setQueryClientContext?',
    )
  }

  return client as QueryClient
}

/** Sets a QueryClient on Svelte's context */
export const setQueryClientContext = (client: QueryClient): void => {
  setContext(_contextKey, client)
}

/** Creates QueryClient and adds it to Svelte's context */
export const setQueryClient = (config?: QueryClientConfig): QueryClient => {
  const client = new QueryClient(config)
  setQueryClientContext(client)
  onMount(() => {
    client.mount()
    return () => {
      client.unmount()
    }
  })
  return client
}
