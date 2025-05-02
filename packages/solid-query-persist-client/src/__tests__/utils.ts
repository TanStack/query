import { QueryClient } from '@tanstack/solid-query'
import type { QueryClientConfig } from '@tanstack/solid-query'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}
