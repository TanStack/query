import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Mutation, QueryClient, QueryObserver, timeoutManager } from '..'
import { defaultTimeoutProvider } from '../timeoutManager'
import { setIsServer } from './utils'

describe.each([false, true])(
  'server timers with custom provider = %s',
  (optIn) => {
    let client: QueryClient
    let resetIsServer: () => void

    beforeEach(() => {
      resetIsServer = setIsServer(true)
      vi.useFakeTimers()
      if (optIn) {
        timeoutManager.setTimeoutProvider({ ...defaultTimeoutProvider })
      }
      client = new QueryClient()
    })

    afterEach(() => {
      client.clear()
      timeoutManager.setTimeoutProvider(defaultTimeoutProvider)
      vi.useRealTimers()
      resetIsServer()
    })

    it('controls GC for unused queries and mutations', async () => {
      const queryKey = ['server-gc']
      await client.query({
        queryKey,
        queryFn: () => Promise.resolve('data'),
        gcTime: 100,
      })
      Mutation.build(client, { gcTime: 100 })

      expect(vi.getTimerCount()).toBe(optIn ? 2 : 0)
      await vi.advanceTimersByTimeAsync(100)

      expect(client.getQueryData(queryKey)).toBe(optIn ? undefined : 'data')
      expect(client.getMutationCache().getAll()).toHaveLength(optIn ? 0 : 1)
    })

    it('controls stale notifications and polling for subscribed observers', async () => {
      const queryFn = vi.fn<() => Promise<string>>().mockResolvedValue('data')
      const observer = new QueryObserver(client, {
        queryKey: ['server-observer'],
        queryFn,
        initialData: 'data',
        staleTime: 10,
        refetchInterval: 100,
        refetchIntervalInBackground: true,
      })
      const unsubscribe = observer.subscribe(() => {})

      try {
        await vi.advanceTimersByTimeAsync(11)
        expect(observer.getCurrentResult().isStale).toBe(optIn)
        await vi.advanceTimersByTimeAsync(89)
        expect(queryFn).toHaveBeenCalledTimes(optIn ? 1 : 0)
      } finally {
        unsubscribe()
      }
    })

    it('settles failed queries with an explicit retry count', async () => {
      const error = new Error('request failed')
      const queryFn = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('data')

      const result = client
        .query({
          queryKey: ['server-retry'],
          queryFn,
          retry: 1,
          retryDelay: 10,
        })
        .catch((reason: unknown) => reason)

      await vi.advanceTimersByTimeAsync(10)
      await expect(result).resolves.toBe(optIn ? 'data' : error)
      expect(queryFn).toHaveBeenCalledTimes(optIn ? 2 : 1)
    })
  },
)
