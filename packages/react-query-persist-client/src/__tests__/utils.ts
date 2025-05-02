import { QueryClient } from '@tanstack/react-query'
import type { QueryClientConfig } from '@tanstack/react-query'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}
