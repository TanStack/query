import { QueryClient } from '@tanstack/svelte-query'
import { act } from '@testing-library/svelte'

import type { QueryClientConfig } from '@tanstack/svelte-query'

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

export function setActTimeout(fn: () => void, ms?: number) {
  return setTimeout(() => {
    act(() => {
      fn()
    })
  }, ms)
}

export type StatusResult<T = unknown> = {
  status: string
  fetchStatus: string
  data: T | undefined
}
