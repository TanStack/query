import { QueryClient } from '@tanstack/svelte-query'

import type {
  CreateQueryResult,
  QueryClientConfig,
} from '@tanstack/svelte-query'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}

export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout)
  })
}

export type StatusResult<T = unknown> = {
  status: string
  fetchStatus: string
  data: T | undefined
}

export class StatelessRef<T> {
  current: T
  constructor(value: T) {
    this.current = value
  }
}
