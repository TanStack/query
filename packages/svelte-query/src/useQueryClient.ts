import type { QueryClient } from '@tanstack/query-core'
import { client } from './store'

export function useQueryClient(): QueryClient {
  let queryClient!: QueryClient
  client.subscribe((val) => {
    queryClient = val
    queryClient.mount()
    return () => {
      queryClient.mount()
    }
  })
  return queryClient
}
