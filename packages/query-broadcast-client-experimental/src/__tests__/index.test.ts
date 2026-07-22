import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { broadcastQueryClient } from '..'
import type { QueryCache } from '@tanstack/query-core'

describe('broadcastQueryClient', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
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
    let unhandledRejections: Array<PromiseRejectionEvent>

    beforeEach(() => {
      unhandledRejections = []
      window.addEventListener('unhandledrejection', (e) => {
        unhandledRejections.push(e)
        e.preventDefault()
      })
    })

    afterEach(() => {
      window.removeEventListener('unhandledrejection', () => {})
    })

    it('should not surface DataCloneError as an unhandledrejection', async () => {
      const unsubscribe = broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel_clone_error',
      })

      // Functions cannot be structured-cloned; setting one as query data
      // triggers a DataCloneError from postMessage
      queryClient.setQueryData(['non-cloneable'], () => 'fn')

      // Give the microtask queue a chance to settle
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(unhandledRejections).toHaveLength(0)
      unsubscribe()
    })

    it('should invoke onBroadcastError with the error and message when postMessage fails', async () => {
      const cloneError = new DOMException('could not be cloned', 'DataCloneError')
      const errors: Array<{ error: unknown; queryHash: string }> = []

      const unsubscribe = broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel_on_error',
        onBroadcastError: (error, message) => {
          errors.push({ error, queryHash: message.queryHash })
        },
      })

      // Simulate a postMessage rejection by overriding the channel's postMessage
      // on the BroadcastChannel prototype so the next call rejects
      const { BroadcastChannel: BC } = await import('broadcast-channel')
      const originalPost = BC.prototype.postMessage
      BC.prototype.postMessage = () => Promise.reject(cloneError)

      queryClient.setQueryData(['key-for-error-test'], 'value')

      await new Promise((resolve) => setTimeout(resolve, 50))

      BC.prototype.postMessage = originalPost

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]!.queryHash).toBe(JSON.stringify(['key-for-error-test']))
      expect(errors[0]!.error).toBe(cloneError)
      unsubscribe()
    })
  })
})
