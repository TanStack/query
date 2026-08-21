import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { broadcastQueryClient } from '..'
import type { BroadcastErrorEvent } from '..'
import type { QueryCache } from '@tanstack/query-core'

const mockPostMessage = vi.fn().mockResolvedValue(undefined)
const mockClose = vi.fn()
let lastCreatedChannel: { onmessage: ((action: any) => void) | null }

vi.mock('broadcast-channel', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    BroadcastChannel: class MockBroadcastChannel {
      onmessage = null
      postMessage = mockPostMessage
      close = mockClose
      constructor() {
        lastCreatedChannel = this
      }
    },
  }
})

describe('broadcastQueryClient', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
    mockPostMessage.mockResolvedValue(undefined)
    mockClose.mockReset()
  })

  it('should subscribe to the query cache', () => {
    broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })
    expect(queryCache.hasListeners()).toBe(true)
  })

  it('should not have any listeners after cleanup', () => {
    const unsubscribe = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })
    unsubscribe()
    expect(queryCache.hasListeners()).toBe(false)
  })

  describe('incoming message handling', () => {
    it('should keep broadcasting local changes after applying an incoming message throws', () => {
      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      // Simulate some other part of the app (e.g. another cache subscriber)
      // throwing synchronously while an incoming cross-tab message is being
      // applied locally.
      const explodingUnsubscribe = queryCache.subscribe(() => {
        throw new Error('boom from an unrelated cache listener')
      })

      expect(() => {
        lastCreatedChannel.onmessage?.({
          type: 'added',
          queryHash: '["remote"]',
          queryKey: ['remote'],
          state: { data: 1 },
        })
      }).toThrow('boom')

      explodingUnsubscribe()
      mockPostMessage.mockClear()

      // A later local change must still be broadcast to other tabs, instead
      // of being silently swallowed because the transaction flag got stuck.
      queryClient.setQueryData(['local'], { value: 1 })

      expect(mockPostMessage).toHaveBeenCalled()
    })

    it('should keep broadcasting local changes after query.setState throws for an existing query', () => {
      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      // Populate the cache with an existing query so the incoming message
      // below is applied via `query.setState` rather than `queryCache.build`.
      queryClient.setQueryData(['existing'], { value: 0 })
      const existingQuery = queryCache.find({ queryKey: ['existing'] })!

      const explodingUnsubscribe = queryCache.subscribe(() => {
        throw new Error('boom from an unrelated cache listener')
      })

      expect(() => {
        lastCreatedChannel.onmessage?.({
          type: 'updated',
          queryHash: existingQuery.queryHash,
          queryKey: ['existing'],
          state: { data: 2 },
        })
      }).toThrow('boom')

      explodingUnsubscribe()
      mockPostMessage.mockClear()

      queryClient.setQueryData(['local2'], { value: 1 })

      expect(mockPostMessage).toHaveBeenCalled()
    })
  })

  describe('postMessage error handling', () => {
    let originalEnv: string | undefined

    beforeEach(() => {
      originalEnv = process.env['NODE_ENV']
    })

    afterEach(() => {
      process.env['NODE_ENV'] = originalEnv
    })

    it('should not cause an unhandled rejection when onBroadcastError itself throws', async () => {
      const key = queryKey()
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const unhandledRejections: Array<unknown> = []
      const onUnhandledRejection = (reason: unknown) => {
        unhandledRejections.push(reason)
      }
      process.on('unhandledRejection', onUnhandledRejection)

      try {
        const onBroadcastError = vi.fn().mockImplementation(() => {
          throw new Error('boom')
        })

        broadcastQueryClient({
          queryClient,
          broadcastChannel: 'test_channel',
          onBroadcastError,
        })

        queryClient.setQueryData(key, { value: 1 })

        await sleep(0)

        expect(onBroadcastError).toHaveBeenCalledWith(
          cloneError,
          expect.objectContaining<BroadcastErrorEvent>({
            type: 'added',
            queryHash: expect.any(String) as string,
            queryKey: key,
          }),
        )
        expect(unhandledRejections).toHaveLength(0)
      } finally {
        process.off('unhandledRejection', onUnhandledRejection)
      }
    })

    it('should warn in dev when onBroadcastError itself throws', async () => {
      const key = queryKey()
      process.env['NODE_ENV'] = 'development'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      const callbackError = new Error('boom')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      try {
        broadcastQueryClient({
          queryClient,
          broadcastChannel: 'test_channel',
          onBroadcastError: () => {
            throw callbackError
          },
        })

        queryClient.setQueryData(key, { value: 1 })

        await sleep(0)

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('onBroadcastError threw while handling'),
          callbackError,
        )
      } finally {
        warnSpy.mockRestore()
      }
    })

    it('should not cause an unhandled rejection when async onBroadcastError rejects', async () => {
      const key = queryKey()
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const unhandledRejections: Array<unknown> = []
      const onUnhandledRejection = (reason: unknown) => {
        unhandledRejections.push(reason)
      }
      process.on('unhandledRejection', onUnhandledRejection)

      try {
        const onBroadcastError = vi
          .fn()
          .mockRejectedValueOnce(new Error('async boom'))

        broadcastQueryClient({
          queryClient,
          broadcastChannel: 'test_channel',
          onBroadcastError,
        })

        queryClient.setQueryData(key, { value: 1 })

        await sleep(10)

        expect(onBroadcastError).toHaveBeenCalledWith(
          cloneError,
          expect.objectContaining<BroadcastErrorEvent>({
            type: 'added',
            queryHash: expect.any(String) as string,
            queryKey: key,
          }),
        )
        expect(unhandledRejections).toHaveLength(0)
      } finally {
        process.off('unhandledRejection', onUnhandledRejection)
      }
    })

    it('should warn in dev when async onBroadcastError rejects', async () => {
      const key = queryKey()
      process.env['NODE_ENV'] = 'development'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      const asyncError = new Error('async boom')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      try {
        broadcastQueryClient({
          queryClient,
          broadcastChannel: 'test_channel',
          onBroadcastError: () => Promise.reject(asyncError),
        })

        queryClient.setQueryData(key, { value: 1 })

        await sleep(10)

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('onBroadcastError threw while handling'),
          asyncError,
        )
      } finally {
        warnSpy.mockRestore()
      }
    })

    it('should call onBroadcastError when postMessage fails', async () => {
      const key = queryKey()
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const onBroadcastError = vi.fn()
      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
        onBroadcastError,
      })

      queryClient.setQueryData(key, { value: 1 })

      await sleep(0)
      expect(onBroadcastError).toHaveBeenCalledWith(
        cloneError,
        expect.objectContaining<BroadcastErrorEvent>({
          type: 'added',
          queryHash: expect.any(String) as string,
          queryKey: key,
        }),
      )
    })

    it('should warn in dev when postMessage fails and onBroadcastError is not provided', async () => {
      const key = queryKey()
      process.env['NODE_ENV'] = 'development'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      try {
        broadcastQueryClient({
          queryClient,
          broadcastChannel: 'test_channel',
        })

        queryClient.setQueryData(key, { value: 1 })

        await sleep(0)
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('cross-tab sync for this query was skipped'),
          cloneError,
        )
      } finally {
        warnSpy.mockRestore()
      }
    })

    it('should not warn in production when postMessage fails', async () => {
      const key = queryKey()
      process.env['NODE_ENV'] = 'production'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      try {
        broadcastQueryClient({
          queryClient,
          broadcastChannel: 'test_channel',
        })

        queryClient.setQueryData(key, { value: 1 })

        await sleep(0)
        expect(warnSpy).not.toHaveBeenCalled()
      } finally {
        warnSpy.mockRestore()
      }
    })
  })
})
