import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { broadcastQueryClient } from '..'
import type { BroadcastErrorEvent } from '..'
import type { QueryCache } from '@tanstack/query-core'

// Mock `broadcast-channel` so tests can drive the `postMessage` promise
// deterministically - jsdom's own `BroadcastChannel` support varies and we
// need to force the failure path that the fix guards against.
const { channelMock, MockBroadcastChannel } = vi.hoisted(() => {
  const channel = {
    postMessage: vi.fn<(message: unknown) => Promise<void>>(),
    close: vi.fn<() => void>(),
    onmessage: null as ((ev: unknown) => void) | null,
  }
  class FakeChannel {
    constructor() {
      return channel
    }
  }
  return { channelMock: channel, MockBroadcastChannel: FakeChannel }
})

vi.mock('broadcast-channel', () => ({
  BroadcastChannel: MockBroadcastChannel,
}))

describe('broadcastQueryClient', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()

    // `restoreMocks: true` (vite.config.ts) clears mock state between tests,
    // so restore the default behavior for the shared channel mock.
    channelMock.postMessage.mockReset().mockResolvedValue(undefined)
    channelMock.close.mockReset()
    channelMock.onmessage = null
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

  describe('when postMessage rejects (non-cloneable payload)', () => {
    it('routes the failure to onBroadcastError with the originating query metadata', async () => {
      const cloneError = new DOMException(
        'A ReadableStream could not be cloned because it was not transferred.',
        'DataCloneError',
      )
      channelMock.postMessage.mockRejectedValue(cloneError)

      const errors: Array<{ error: unknown; event: BroadcastErrorEvent }> = []
      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
        onBroadcastError: (error, event) => {
          errors.push({ error, event })
        },
      })

      // `setQueryData` on a fresh query triggers both `added` (from the
      // build step) and `updated` (from the success dispatch). Both
      // broadcasts should fail and both failures should reach the hook.
      queryClient.setQueryData(['stream'], { body: 'non-cloneable' })

      await vi.waitFor(() => {
        expect(errors).toHaveLength(2)
      })

      const eventTypes = errors.map(({ event }) => event.type)
      expect(eventTypes).toContain('added')
      expect(eventTypes).toContain('updated')

      for (const { error, event } of errors) {
        expect(error).toBe(cloneError)
        expect(event.queryKey).toEqual(['stream'])
        expect(event.queryHash).toEqual(expect.any(String))
      }
    })

    it('falls back to console.warn in development when no hook is provided', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      channelMock.postMessage.mockRejectedValue(
        new DOMException('clone failed', 'DataCloneError'),
      )

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      queryClient.setQueryData(['stream'], { body: 'non-cloneable' })

      await vi.waitFor(() => {
        expect(warn).toHaveBeenCalled()
      })

      const [firstCall] = warn.mock.calls
      expect(firstCall?.[0]).toEqual(
        expect.stringContaining('[broadcastQueryClient]'),
      )
    })

    it('does not surface broadcast failures as unhandled rejections', async () => {
      const onUnhandled = vi.fn()
      process.on('unhandledRejection', onUnhandled)

      try {
        channelMock.postMessage.mockRejectedValue(
          new DOMException('clone failed', 'DataCloneError'),
        )

        broadcastQueryClient({
          queryClient,
          broadcastChannel: 'test_channel',
          // Silent hook - the assertion is on the rejection path, not on the
          // hook's observability side effect.
          onBroadcastError: () => {},
        })

        queryClient.setQueryData(['stream'], { body: 'non-cloneable' })

        // Let Node's microtask queue and `unhandledRejection` scheduler run.
        await new Promise((resolve) => setTimeout(resolve, 20))

        expect(onUnhandled).not.toHaveBeenCalled()
      } finally {
        process.off('unhandledRejection', onUnhandled)
      }
    })
  })
})
