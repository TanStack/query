import type { QueryClient } from '@tanstack/react-query'
import { userOptions } from '@/app/queries'

export function prefetchUser(queryClient: QueryClient, id: string) {
  return queryClient.prefetchQuery(userOptions(id))
}
