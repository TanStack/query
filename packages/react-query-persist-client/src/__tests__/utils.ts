import { act } from '@testing-library/react'

import type { QueryClientConfig } from '@tanstack/query-core'
import { QueryClient } from '@tanstack/query-core'
import { vi } from 'vitest'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  return new QueryClient({ logger: mockLogger, ...config })
}

export const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
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
