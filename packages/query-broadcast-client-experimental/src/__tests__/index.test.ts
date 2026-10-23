import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { broadcastQueryClient } from '..'
import type { BroadcastErrorEvent } from '..'
import type { QueryCache } from '@tanstack/query-core'
import type { BroadcastChannel } from 'broadcast-channel'

const mockPostMessage = vi
  .fn<BroadcastChannel['postMessage']>()
  .mockResolvedValue(undefined)
const mockClose = vi.fn<BroadcastChannel['close']>()
let lastCreatedChannel: { onmessage: ((action: any) => void) | null }

vi.mock(import('broadcast-channel'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    BroadcastChannel: class MockBroadcastChannel {
      readonly id = 0
      readonly name: string
      readonly options = {}
      readonly type = 'simulate'
      readonly isClosed = false
      onmessage = null
      postMessage = mockPostMessage
      close = mockClose
      addEventListener = vi.fn<BroadcastChannel['addEventListener']>()
      removeEventListener = vi.fn<BroadcastChannel['removeEventListener']>()
      constructor(name: string) {
        this.name = name
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
      const remoteKey = createKey()
      const localKey = createKey()

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
          queryHash: JSON.stringify(remoteKey),
          queryKey: remoteKey,
          state: { data: 1 },
        })
      }).toThrow('boom')

      explodingUnsubscribe()
      mockPostMessage.mockClear()

      // A later local change must still be broadcast to other tabs, instead
      // of being silently swallowed because the transaction flag got stuck.
      queryClient.setQueryData(localKey, { value: 1 })
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: localKey }),
      )
    })

    it('should keep broadcasting local changes after query.setState throws for an existing query', () => {
      const existingKey = createKey()
      const localKey = createKey()

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      // Populate the cache with an existing query so the incoming message
      // below is applied via `query.setState` rather than `queryCache.build`.
      queryClient.setQueryData(existingKey, { value: 0 })
      const existingQuery = queryCache.find({ queryKey: existingKey })!

      const explodingUnsubscribe = queryCache.subscribe(() => {
        throw new Error('boom from an unrelated cache listener')
      })

      expect(() => {
        lastCreatedChannel.onmessage?.({
          type: 'updated',
          queryHash: existingQuery.queryHash,
          queryKey: existingKey,
          state: { data: 2 },
        })
      }).toThrow('boom')

      explodingUnsubscribe()
      mockPostMessage.mockClear()

      queryClient.setQueryData(localKey, { value: 1 })
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: localKey }),
      )
    })

    it('should not overwrite an existing query with data when an "added" message arrives for it', () => {
      const existingKey = createKey()

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      // A query that already resolved in this tab (e.g. it fetched before
      // another tab mounted the same key).
      queryClient.setQueryData(existingKey, { value: 'resolved' })
      const existingQuery = queryCache.find({ queryKey: existingKey })!

      // Another tab just mounted the same key for the first time, so its
      // `build()` broadcasts an `added` message with a pending state and
      // no data.
      lastCreatedChannel.onmessage?.({
        type: 'added',
        queryHash: existingQuery.queryHash,
        queryKey: existingKey,
        state: { status: 'pending', data: undefined },
      })
      expect(queryClient.getQueryData(existingKey)).toStrictEqual({
        value: 'resolved',
      })
      expect(queryClient.getQueryState(existingKey)?.status).toBe('success')
    })

    it('should preserve an existing query error when an empty "added" message arrives', async () => {
      const existingKey = queryKey()
      const error = new Error('down')

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      const existingQuery = queryCache.build(queryClient, {
        queryKey: existingKey,
      })
      const emptyState = existingQuery.state

      await expect(
        queryClient.query({
          queryKey: existingKey,
          queryFn: () => Promise.reject(error),
          retry: false,
        }),
      ).rejects.toBe(error)
      const errorState = existingQuery.state
      expect(errorState.errorUpdatedAt).toBeGreaterThan(0)

      lastCreatedChannel.onmessage?.({
        type: 'added',
        queryHash: existingQuery.queryHash,
        queryKey: existingKey,
        state: emptyState,
      })

      expect(existingQuery.state).toBe(errorState)
      expect(existingQuery.state).toMatchObject({
        status: 'error',
        fetchStatus: 'idle',
        data: undefined,
        error,
      })
    })

    it('should preserve an existing fetch when an empty "added" message arrives', async () => {
      const existingKey = queryKey()

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      const existingQuery = queryCache.build(queryClient, {
        queryKey: existingKey,
      })
      const emptyState = existingQuery.state
      const promise = queryClient.query({
        queryKey: existingKey,
        queryFn: async () => {
          await sleep(10)
          return 'local data'
        },
      })
      const fetchingState = existingQuery.state
      expect(fetchingState.fetchStatus).toBe('fetching')

      lastCreatedChannel.onmessage?.({
        type: 'added',
        queryHash: existingQuery.queryHash,
        queryKey: existingKey,
        state: emptyState,
      })

      expect(existingQuery.state).toBe(fetchingState)
      expect(existingQuery.state.fetchStatus).toBe('fetching')
      await expect(promise).resolves.toBe('local data')
    })

    it('should adopt an "added" message\'s state for an existing query that has no data yet', () => {
      const existingKey = createKey()

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      // This tab has already built the query (e.g. an observer mounted it)
      // but hasn't fetched it yet.
      const existingQuery = queryCache.build(queryClient, {
        queryKey: existingKey,
      })

      // Another tab already had this key resolved (e.g. via `initialData`)
      // when it mounted, so its `added` message carries real data.
      lastCreatedChannel.onmessage?.({
        type: 'added',
        queryHash: existingQuery.queryHash,
        queryKey: existingKey,
        state: {
          status: 'success',
          data: { value: 'from other tab' },
          dataUpdatedAt: Date.now(),
        },
      })
      expect(queryClient.getQueryData(existingKey)).toStrictEqual({
        value: 'from other tab',
      })
    })

    it('should adopt a settled error from an "added" message for an existing query without data', () => {
      const existingKey = queryKey()
      const error = new Error('remote error')

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      const existingQuery = queryCache.build(queryClient, {
        queryKey: existingKey,
      })
      const state = {
        ...existingQuery.state,
        status: 'error' as const,
        error,
        errorUpdatedAt: Date.now(),
      }

      lastCreatedChannel.onmessage?.({
        type: 'added',
        queryHash: existingQuery.queryHash,
        queryKey: existingKey,
        state,
      })

      expect(existingQuery.state).toStrictEqual(state)
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
      const key = createKey()
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const unhandledRejections: Array<unknown> = []
      const onUnhandledRejection = (reason: unknown) => {
        unhandledRejections.push(reason)
      }
      process.on('unhandledRejection', onUnhandledRejection)

      try {
        const onBroadcastError = vi.fn<() => never>().mockImplementation(() => {
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
      const key = createKey()
      process.env['NODE_ENV'] = 'development'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      const callbackError = new Error('boom')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const consoleWarnMock = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
        onBroadcastError: () => {
          throw callbackError
        },
      })

      queryClient.setQueryData(key, { value: 1 })
      await sleep(0)
      expect(consoleWarnMock).toHaveBeenCalledWith(
        expect.stringContaining('onBroadcastError threw while handling'),
        callbackError,
      )
    })

    it('should not cause an unhandled rejection when async onBroadcastError rejects', async () => {
      const key = createKey()
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const unhandledRejections: Array<unknown> = []
      const onUnhandledRejection = (reason: unknown) => {
        unhandledRejections.push(reason)
      }
      process.on('unhandledRejection', onUnhandledRejection)

      try {
        const onBroadcastError = vi
          .fn<() => Promise<never>>()
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
      const key = createKey()
      process.env['NODE_ENV'] = 'development'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      const asyncError = new Error('async boom')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const consoleWarnMock = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
        onBroadcastError: () => Promise.reject(asyncError),
      })

      queryClient.setQueryData(key, { value: 1 })
      await sleep(10)
      expect(consoleWarnMock).toHaveBeenCalledWith(
        expect.stringContaining('onBroadcastError threw while handling'),
        asyncError,
      )
    })

    it('should call onBroadcastError when postMessage fails', async () => {
      const key = createKey()
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const onBroadcastError =
        vi.fn<
          (error: unknown, event: BroadcastErrorEvent) => void | Promise<void>
        >()
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
      const key = createKey()
      process.env['NODE_ENV'] = 'development'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const consoleWarnMock = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      queryClient.setQueryData(key, { value: 1 })
      await sleep(0)
      expect(consoleWarnMock).toHaveBeenCalledWith(
        expect.stringContaining('cross-tab sync for this query was skipped'),
        cloneError,
      )
    })

    it('should not warn in production when postMessage fails', async () => {
      const key = createKey()
      process.env['NODE_ENV'] = 'production'
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockRejectedValueOnce(cloneError)

      const consoleWarnMock = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      broadcastQueryClient({
        queryClient,
        broadcastChannel: 'test_channel',
      })

      queryClient.setQueryData(key, { value: 1 })
      await sleep(0)
      expect(consoleWarnMock).not.toHaveBeenCalled()
    })
  })
})
