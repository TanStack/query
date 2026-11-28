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
        timeoutManager.setTimeoutProvider({
          setTimeout,
          clearTimeout,
          setInterval,
          clearInterval,
        })
      }
      client = new QueryClient()
    })

    afterEach(() => {
      client.clear()
      timeoutManager.setTimeoutProvider(defaultTimeoutProvider)
      vi.useRealTimers()
      resetIsServer()
    })

    it.each([undefined, 100])(
      'controls GC for unused queries and mutations with gcTime = %s',
      async (gcTime) => {
        const queryKey = ['server-gc']
        await client.query({
          queryKey,
          queryFn: () => Promise.resolve('data'),
          gcTime,
        })
        Mutation.build(client, { gcTime })

        expect(vi.getTimerCount()).toBe(optIn ? 2 : 0)
        await vi.advanceTimersByTimeAsync(gcTime ?? 5 * 60 * 1000)

        expect(client.getQueryData(queryKey)).toBe(optIn ? undefined : 'data')
        expect(client.getMutationCache().getAll()).toHaveLength(optIn ? 0 : 1)
      },
    )

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

    it('uses the default retry count for observed queries when the provider schedules retries', async () => {
      const error = new Error('request failed')
      const queryFn = vi.fn<() => Promise<string>>().mockRejectedValue(error)
      const observer = new QueryObserver(client, {
        queryKey: ['observed-server-retry'],
        queryFn,
        retryDelay: 10,
      })
      const unsubscribe = observer.subscribe(() => {})

      try {
        await vi.advanceTimersByTimeAsync(30)
        expect(queryFn).toHaveBeenCalledTimes(optIn ? 4 : 1)
        expect(observer.getCurrentResult().error).toBe(error)
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
