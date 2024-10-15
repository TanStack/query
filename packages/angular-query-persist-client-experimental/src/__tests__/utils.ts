import { QueryClient } from '@tanstack/angular-query-experimental'
import type { QueryClientConfig } from '@tanstack/angular-query-experimental'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}

let queryKeyCount = 0
export function queryKey(): Array<string> {
  queryKeyCount++
  return [`query_${queryKeyCount}`]
}

export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout)
  })
}
