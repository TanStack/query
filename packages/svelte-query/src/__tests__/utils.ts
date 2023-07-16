import { vi } from 'vitest'
import { act } from '@testing-library/svelte'
import { QueryClient } from '../index'
import type { QueryClientConfig } from '../index'
import type { SpyInstance } from 'vitest'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}

export function mockVisibilityState(value: DocumentVisibilityState): SpyInstance<[], DocumentVisibilityState> {
  return vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
}

export function mockNavigatorOnLine(value: boolean): SpyInstance<[], boolean> {
  return vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
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

export async function simplefetcher() {
  await sleep(10)
  return 'test'
}

export function setActTimeout(fn: () => void, ms?: number) {
  return setTimeout(() => {
    act(() => {
      fn()
    })
  }, ms)
}
