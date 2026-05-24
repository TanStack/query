import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { broadcastQueryClient } from '..'
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
        expect.objectContaining({ type: 'added' }),
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
        expect.stringContaining('[broadcastQueryClient]'),
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
