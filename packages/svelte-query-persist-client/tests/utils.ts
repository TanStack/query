import { QueryClient } from '@tanstack/svelte-query'

import type { QueryClientConfig } from '@tanstack/svelte-query'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}

export type StatusResult<T = unknown> = {
  status: string
  fetchStatus: string
  data: T | undefined
}
