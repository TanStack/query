import type { QueryClient } from '@tanstack/query-core'
import { client } from './store'

export function useQueryClient(): QueryClient {
  let queryClient!: QueryClient
  client.subscribe((client) => {
    queryClient = client
    client.mount()
    return () => {
      client.mount()
    }
  })
  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }
  return queryClient
}
