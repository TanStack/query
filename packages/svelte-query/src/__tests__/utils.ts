import { vi } from 'vitest'
import { act } from '@testing-library/svelte'
import {
  type MutationOptions,
  QueryClient,
  type QueryClientConfig,
} from '../index'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  return new QueryClient({ logger: mockLogger, ...config })
}

export function mockVisibilityState(value: DocumentVisibilityState) {
  return vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
}

export function mockNavigatorOnLine(value: boolean) {
  return vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
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

/**
 * Assert the parameter is of a specific type.
 */
export function expectType<T>(_: T): void {
  return undefined
}

/**
 * Assert the parameter is not typed as `any`
 */
export function expectTypeNotAny<T>(_: 0 extends 1 & T ? never : T): void {
  return undefined
}

export function executeMutation(
  queryClient: QueryClient,
  options: MutationOptions<any, any, any, any>,
): Promise<unknown> {
  return queryClient.getMutationCache().build(queryClient, options).execute()
}
