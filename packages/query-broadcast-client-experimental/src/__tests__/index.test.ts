import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { broadcastQueryClient } from '..'
import type { QueryCache } from '@tanstack/query-core'

const broadcastChannelMock = vi.hoisted(() => {
  const channels: Array<{
    postMessage: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
    onmessage: ((message: unknown) => void) | null
  }> = []

  class BroadcastChannel {
    onmessage: ((message: unknown) => void) | null = null
    postMessage = vi.fn(() => Promise.resolve())
    close = vi.fn()

    constructor(_name: string, _options: unknown) {
      channels.push(this)
    }
  }

  return {
    BroadcastChannel,
    channels,
  }
})

vi.mock('broadcast-channel', () => ({
  BroadcastChannel: broadcastChannelMock.BroadcastChannel,
}))

describe('broadcastQueryClient', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    broadcastChannelMock.channels.length = 0
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

  it('should report postMessage rejections without unhandled rejections', async () => {
    const error = new DOMException('cannot clone', 'DataCloneError')
    const onBroadcastError = vi.fn()
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)

    broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
      onBroadcastError,
    })

    const channel = broadcastChannelMock.channels[0]!
    channel.postMessage.mockImplementation((message: { type: string }) =>
      message.type === 'updated' ? Promise.reject(error) : Promise.resolve(),
    )

    queryClient.setQueryData(['stream'], new ReadableStream())

    await vi.waitFor(() => {
      expect(onBroadcastError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          type: 'updated',
          queryHash: '["stream"]',
          queryKey: ['stream'],
        }),
      )
    })

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[broadcastQueryClient] failed to broadcast "updated" for queryHash "["stream"]"',
      error,
    )
  })
})
