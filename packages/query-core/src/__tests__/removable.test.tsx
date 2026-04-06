import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient, QueryObserver } from '..'
import { defaultTimeoutProvider, timeoutManager } from '../timeoutManager'

describe('removable', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
    timeoutManager.setTimeoutProvider(defaultTimeoutProvider)
  })

  describe('falsy timer ID (0) handling', () => {
    test('should call clearTimeout for gcTimeout when timer ID is 0', async () => {
      const provider = {
        setTimeout: vi.fn(() => 0),
        clearTimeout: vi.fn(),
        setInterval: vi.fn(() => 0),
        clearInterval: vi.fn(),
      }
      timeoutManager.setTimeoutProvider(provider)

      const key = queryKey()
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 100,
      })

      // Subscribe then unsubscribe: no observers left → scheduleGc() sets #gcTimeout = 0
      const unsubscribe = observer.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(0)
      unsubscribe()

      // Subscribe again: addObserver calls clearGcTimeout() → must call clearTimeout(0)
      const unsubscribe2 = observer.subscribe(() => undefined)

      expect(provider.clearTimeout).toHaveBeenCalledWith(0)

      unsubscribe2()
    })
  })
})
