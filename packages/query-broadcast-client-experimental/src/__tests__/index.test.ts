import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { broadcastQueryClient } from '..'
import type { BroadcastErrorEvent } from '..'
import type { QueryCache } from '@tanstack/query-core'

const mockPostMessage = vi.fn().mockResolvedValue(undefined)
const mockClose = vi.fn()

vi.mock('broadcast-channel', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    BroadcastChannel: class MockBroadcastChannel {
      onmessage = null
      postMessage = mockPostMessage
      close = mockClose
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

  describe('postMessage error handling', () => {
    let originalEnv: string | undefined

    beforeEach(() => {
      originalEnv = process.env['NODE_ENV']
    })

    afterEach(() => {
      process.env['NODE_ENV'] = originalEnv
    })

    it('should not cause an unhandled rejection when onBroadcastError itself throws', async () => {
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

        queryClient.setQueryData(['test'], { value: 1 })

        await new Promise((r) => setTimeout(r, 0))

        expect(onBroadcastError).toHaveBeenCalledWith(
          cloneError,
          expect.objectContaining<BroadcastErrorEvent>({
            type: 'added',
            queryHash: expect.any(String) as string,
            queryKey: ['test'],
          }),
        )
        expect(unhandledRejections).toHaveLength(0)
      } finally {
        process.off('unhandledRejection', onUnhandledRejection)
      }
    })

    it('should warn in dev when onBroadcastError itself throws', async () => {
      process.env['NODE_ENV'] = 'development'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      const callbackError = new Error('boom')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
        onBroadcastError: () => {
          throw callbackError
        },
      })

      queryClient.setQueryData(['test'], { value: 1 })

      await new Promise((r) => setTimeout(r, 0))

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('onBroadcastError threw while handling'),
        callbackError,
      )

      warnSpy.mockRestore()
    })

    it('should not cause an unhandled rejection when async onBroadcastError rejects', async () => {
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

        queryClient.setQueryData(['test'], { value: 1 })

        await new Promise((r) => setTimeout(r, 10))

        expect(onBroadcastError).toHaveBeenCalledWith(
          cloneError,
          expect.objectContaining<BroadcastErrorEvent>({
            type: 'added',
            queryHash: expect.any(String) as string,
            queryKey: ['test'],
          }),
        )
        expect(unhandledRejections).toHaveLength(0)
      } finally {
        process.off('unhandledRejection', onUnhandledRejection)
      }
    })

    it('should warn in dev when async onBroadcastError rejects', async () => {
      process.env['NODE_ENV'] = 'development'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      const asyncError = new Error('async boom')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
        onBroadcastError: () => Promise.reject(asyncError),
      })

      queryClient.setQueryData(['test'], { value: 1 })

      await new Promise((r) => setTimeout(r, 10))

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('onBroadcastError threw while handling'),
        asyncError,
      )

      warnSpy.mockRestore()
    })

    it('should call onBroadcastError when postMessage fails', async () => {
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const onBroadcastError = vi.fn()
      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
        onBroadcastError,
      })

      queryClient.setQueryData(['test'], { value: 1 })

      await new Promise((r) => setTimeout(r, 0))
      expect(onBroadcastError).toHaveBeenCalledWith(
        cloneError,
        expect.objectContaining<BroadcastErrorEvent>({
          type: 'added',
          queryHash: expect.any(String) as string,
          queryKey: ['test'],
        }),
      )
    })

    it('should warn in dev when postMessage fails and onBroadcastError is not provided', async () => {
      process.env['NODE_ENV'] = 'development'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      queryClient.setQueryData(['test'], { value: 1 })

      await new Promise((r) => setTimeout(r, 0))
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('cross-tab sync for this query was skipped'),
        cloneError,
      )

      warnSpy.mockRestore()
    })

    it('should not warn in production when postMessage fails', async () => {
      process.env['NODE_ENV'] = 'production'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      queryClient.setQueryData(['test'], { value: 1 })

      await new Promise((r) => setTimeout(r, 0))
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })
})
