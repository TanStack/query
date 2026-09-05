import { QueryClient, QueryObserver } from '@tanstack/query-core'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { broadcastQueryClient, broadcastQueryClientRestore } from '..'
import type { BroadcastErrorEvent } from '..'
import type { QueryCache } from '@tanstack/query-core'

const mockPostMessage = vi.fn().mockResolvedValue(undefined)
const mockClose = vi.fn()
let lastCreatedChannel: { onmessage: ((action: any) => void) | null }
const createdChannels: Array<{
  onmessage: ((action: any) => void) | null
}> = []

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
        createdChannels.push(this)
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
    mockPostMessage.mockClear()
    mockClose.mockReset()
    createdChannels.length = 0
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

  it('should request and restore a query snapshot before completing', async () => {
    vi.useFakeTimers()
    try {
      const key = queryKey()

      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 100,
      })

      const request = mockPostMessage.mock.calls[0]?.[0]

      expect(request).toEqual({
        type: 'cache-request',
        requestId: expect.any(String),
      })

      lastCreatedChannel.onmessage?.({
        type: 'cache-response',
        requestId: request.requestId,
        responderId: 'peer-1',
        responseId: 'response-1',
        query: {
          queryHash: JSON.stringify(key),
          queryKey: key,
          state: {
            data: { value: 1 },
            dataUpdateCount: 1,
            dataUpdatedAt: 10,
            error: null,
            errorUpdateCount: 0,
            errorUpdatedAt: 0,
            fetchFailureCount: 0,
            fetchFailureReason: null,
            fetchMeta: null,
            isInvalidated: false,
            status: 'success',
            fetchStatus: 'idle',
          },
        },
      })

      vi.advanceTimersByTime(100)
      await restored

      expect(queryClient.getQueryData(key)).toEqual({ value: 1 })
      cleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should merge responses from multiple tabs by query freshness', async () => {
    vi.useFakeTimers()
    try {
      const firstKey = queryKey()
      const secondKey = queryKey()
      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 100,
      })
      const request = mockPostMessage.mock.calls[0]?.[0]

      const sendResponse = (
        key: typeof firstKey,
        data: unknown,
        dataUpdatedAt: number,
        responseId: string,
      ) => {
        lastCreatedChannel.onmessage?.({
          type: 'cache-response',
          requestId: request.requestId,
          responderId: responseId,
          responseId,
          query: {
            queryHash: JSON.stringify(key),
            queryKey: key,
            state: {
              data,
              dataUpdateCount: 1,
              dataUpdatedAt,
              error: null,
              errorUpdateCount: 0,
              errorUpdatedAt: 0,
              fetchFailureCount: 0,
              fetchFailureReason: null,
              fetchMeta: null,
              isInvalidated: false,
              status: 'success',
              fetchStatus: 'idle',
            },
          },
        })
      }

      sendResponse(firstKey, 'old first', 1, 'response-1')
      sendResponse(firstKey, 'new first', 2, 'response-2')
      sendResponse(secondKey, 'old second', 1, 'response-3')
      sendResponse(secondKey, 'new second', 2, 'response-4')

      vi.advanceTimersByTime(100)
      await restored

      expect(queryClient.getQueryData(firstKey)).toBe('new first')
      expect(queryClient.getQueryData(secondKey)).toBe('new second')
      cleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should ignore unknown and late bootstrap responses', async () => {
    vi.useFakeTimers()
    try {
      const key = queryKey()
      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 100,
      })
      const request = mockPostMessage.mock.calls[0]?.[0]

      lastCreatedChannel.onmessage?.({
        type: 'cache-response',
        requestId: 'unknown-request',
        responderId: 'peer-1',
        responseId: 'unknown-response',
        query: {
          queryHash: JSON.stringify(key),
          queryKey: key,
          state: { data: 'unknown', status: 'success', dataUpdatedAt: 1 },
        },
      })

      vi.advanceTimersByTime(100)
      await restored

      lastCreatedChannel.onmessage?.({
        type: 'cache-response',
        requestId: request.requestId,
        responderId: 'peer-1',
        responseId: 'late-response',
        query: {
          queryHash: JSON.stringify(key),
          queryKey: key,
          state: { data: 'late', status: 'success', dataUpdatedAt: 2 },
        },
      })

      expect(queryClient.getQueryData(key)).toBeUndefined()
      cleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should ignore duplicate and malformed bootstrap responses', async () => {
    vi.useFakeTimers()
    try {
      const key = queryKey()
      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 100,
      })
      const request = mockPostMessage.mock.calls[0]?.[0]
      const response = {
        type: 'cache-response',
        requestId: request.requestId,
        responderId: 'peer-1',
        responseId: 'response-1',
        query: {
          queryHash: JSON.stringify(key),
          queryKey: key,
          state: { data: 'first', status: 'success', dataUpdatedAt: 1 },
        },
      }

      expect(() => {
        lastCreatedChannel.onmessage?.({
          type: 'cache-response',
          requestId: request.requestId,
          responderId: 'peer-1',
          responseId: 'malformed',
          query: { queryKey: key },
        })
      }).not.toThrow()

      lastCreatedChannel.onmessage?.(response)
      lastCreatedChannel.onmessage?.({
        ...response,
        query: {
          ...response.query,
          state: { data: 'duplicate', status: 'success', dataUpdatedAt: 2 },
        },
      })

      expect(queryClient.getQueryData(key)).toBe('first')
      await vi.advanceTimersByTimeAsync(100)
      await restored
      cleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should correlate simultaneous bootstrap requests independently', async () => {
    vi.useFakeTimers()
    try {
      const [firstCleanup, firstRestored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 100,
      })
      const firstRequest = mockPostMessage.mock.calls[0]?.[0]
      const [secondCleanup, secondRestored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 100,
      })
      const secondRequest = mockPostMessage.mock.calls[1]?.[0]

      expect(firstRequest.requestId).not.toBe(secondRequest.requestId)

      await vi.advanceTimersByTimeAsync(100)
      await Promise.all([firstRestored, secondRestored])
      firstCleanup()
      secondCleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should not rebroadcast bootstrap hydration', async () => {
    vi.useFakeTimers()
    try {
      const key = queryKey()
      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 100,
      })
      const request = mockPostMessage.mock.calls[0]?.[0]
      const postCountBeforeHydration = mockPostMessage.mock.calls.length

      lastCreatedChannel.onmessage?.({
        type: 'cache-response',
        requestId: request.requestId,
        responderId: 'peer-1',
        responseId: 'response-1',
        query: {
          queryHash: JSON.stringify(key),
          queryKey: key,
          state: {
            data: { value: 1 },
            dataUpdateCount: 1,
            dataUpdatedAt: 1,
            error: null,
            errorUpdateCount: 0,
            errorUpdatedAt: 0,
            fetchFailureCount: 0,
            fetchFailureReason: null,
            isInvalidated: false,
            status: 'success',
            fetchStatus: 'idle',
          },
        },
      })

      expect(mockPostMessage).toHaveBeenCalledTimes(postCountBeforeHydration)
      vi.advanceTimersByTime(100)
      await restored
      cleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should continue live synchronization after bootstrap completes', async () => {
    vi.useFakeTimers()
    try {
      const key = queryKey()
      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 10,
      })
      const request = mockPostMessage.mock.calls[0]?.[0]

      lastCreatedChannel.onmessage?.({
        type: 'cache-response',
        requestId: request.requestId,
        responderId: 'peer-1',
        responseId: 'bootstrap-response',
        query: {
          queryHash: JSON.stringify(key),
          queryKey: key,
          state: { data: 'bootstrapped', status: 'success', dataUpdatedAt: 1 },
        },
      })
      await vi.advanceTimersByTimeAsync(10)
      await restored

      mockPostMessage.mockClear()
      queryClient.setQueryData(key, 'live-update')

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'updated',
          queryKey: key,
          state: expect.objectContaining({ data: 'live-update' }),
        }),
      )
      cleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should not let an older live update overwrite fresher bootstrap data', () => {
    const key = queryKey()
    const cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })

    queryClient.setQueryData(key, 'new', { updatedAt: 20 })
    const currentState = queryClient.getQueryState(key)!

    lastCreatedChannel.onmessage?.({
      type: 'updated',
      queryHash: JSON.stringify(key),
      queryKey: key,
      state: {
        ...currentState,
        data: 'old',
        dataUpdatedAt: 10,
      },
    })

    expect(queryClient.getQueryData(key)).toBe('new')
    cleanup()
  })

  it('should preserve the synchronous legacy API and avoid bootstrap requests', () => {
    const cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })

    expect(cleanup).toEqual(expect.any(Function))
    expect(mockPostMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'cache-request' }),
    )

    queryClient.setQueryData(['legacy-live-sync'], 'live')
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'added' }),
    )

    cleanup()
  })

  it('should expose stable synchronous and asynchronous API signatures', () => {
    expectTypeOf(broadcastQueryClient).returns.toEqualTypeOf<() => void>()
    expectTypeOf(broadcastQueryClientRestore).returns.toEqualTypeOf<
      [() => void, Promise<void>]
    >()
  })

  it('should apply incoming added, updated, and removed messages', () => {
    const addedKey = queryKey()
    const updatedKey = queryKey()
    const removedKey = queryKey()

    queryClient.setQueryData(updatedKey, 'before', { updatedAt: 1 })
    queryClient.setQueryData(removedKey, 'remove-me')
    const cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })

    lastCreatedChannel.onmessage?.({
      type: 'added',
      queryHash: JSON.stringify(addedKey),
      queryKey: addedKey,
      state: { data: 'added', dataUpdatedAt: 2 },
    })
    lastCreatedChannel.onmessage?.({
      type: 'updated',
      queryHash: JSON.stringify(updatedKey),
      queryKey: updatedKey,
      state: { data: 'updated', dataUpdatedAt: 2 },
    })
    lastCreatedChannel.onmessage?.({
      type: 'removed',
      queryHash: JSON.stringify(removedKey),
      queryKey: removedKey,
    })
    lastCreatedChannel.onmessage?.({
      type: 'removed',
      queryHash: JSON.stringify(queryKey()),
      queryKey: queryKey(),
    })

    expect(queryClient.getQueryData(addedKey)).toBe('added')
    expect(queryClient.getQueryData(updatedKey)).toBe('updated')
    expect(queryClient.getQueryData(removedKey)).toBeUndefined()
    cleanup()
  })

  it('should broadcast local additions and successful updates only', () => {
    const key = queryKey()
    const cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })

    queryClient.setQueryData(key, 'first')
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'added' }),
    )

    mockPostMessage.mockClear()
    queryClient.setQueryData(key, 'second')
    expect(mockPostMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'updated' }),
    )

    mockPostMessage.mockClear()
    const query = queryCache.find({ queryKey: key })!
    query.setState({
      ...query.state,
      status: 'error',
      error: new Error('local error'),
      errorUpdatedAt: 3,
    })
    expect(mockPostMessage).not.toHaveBeenCalled()
    cleanup()
  })

  it('should broadcast removals only while a query has observers', () => {
    const key = queryKey()
    const cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })
    queryClient.setQueryData(key, 'value')
    mockPostMessage.mockClear()

    queryCache.remove(queryCache.find({ queryKey: key })!)
    expect(mockPostMessage).not.toHaveBeenCalled()

    const observedKey = queryKey()
    queryClient.setQueryData(observedKey, 'observed')
    const query = queryCache.find({ queryKey: observedKey })!
    const observer = new QueryObserver(queryClient, {
      queryKey: observedKey,
      queryFn: () => Promise.resolve('observed'),
    })
    const unsubscribe = observer.subscribe(() => {})
    mockPostMessage.mockClear()
    queryCache.remove(query)
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removed',
        queryKey: observedKey,
      }),
    )
    unsubscribe()
    cleanup()
  })

  it('should honor custom query dehydration filters', async () => {
    const peerQueryClient = new QueryClient()
    peerQueryClient.setQueryData(['include'], 'included')
    peerQueryClient.setQueryData(['exclude'], 'excluded')
    const cleanup = broadcastQueryClientRestore({
      queryClient: peerQueryClient,
      broadcastChannel: 'test_channel',
      timeout: 0,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => query.queryKey[0] === 'include',
      },
    })[0]

    mockPostMessage.mockClear()
    lastCreatedChannel.onmessage?.({
      type: 'cache-request',
      requestId: 'filtered-request',
    })
    await sleep(0)

    expect(mockPostMessage).toHaveBeenCalledTimes(1)
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'cache-response',
        requestId: 'filtered-request',
        query: expect.objectContaining({ queryKey: ['include'] }),
      }),
    )
    cleanup()
  })

  it('should bootstrap successful queries while excluding pending and error queries', () => {
    const peerQueryClient = new QueryClient()
    peerQueryClient.setQueryData(['success'], 'success')
    const pendingQuery = peerQueryClient.getQueryCache().build(
      peerQueryClient,
      { queryKey: ['pending'] },
      {
        data: undefined,
        dataUpdateCount: 0,
        dataUpdatedAt: 0,
        error: null,
        errorUpdateCount: 0,
        errorUpdatedAt: 0,
        fetchFailureCount: 0,
        fetchFailureReason: null,
        fetchMeta: null,
        fetchStatus: 'fetching',
        isInvalidated: false,
        status: 'pending',
      },
    )
    const errorQuery = peerQueryClient.getQueryCache().build(
      peerQueryClient,
      { queryKey: ['error'] },
      {
        data: undefined,
        dataUpdateCount: 0,
        dataUpdatedAt: 0,
        error: new Error('query error'),
        errorUpdateCount: 1,
        errorUpdatedAt: 1,
        fetchFailureCount: 1,
        fetchFailureReason: new Error('query error'),
        fetchMeta: null,
        fetchStatus: 'idle',
        isInvalidated: false,
        status: 'error',
      },
    )
    expect(pendingQuery.state.status).toBe('pending')
    expect(errorQuery.state.status).toBe('error')

    const cleanup = broadcastQueryClientRestore({
      queryClient: peerQueryClient,
      broadcastChannel: 'test_channel',
      timeout: 0,
    })[0]
    mockPostMessage.mockClear()
    lastCreatedChannel.onmessage?.({
      type: 'cache-request',
      requestId: 'successful-only-request',
    })

    const responses = mockPostMessage.mock.calls.map(([message]) => message)
    expect(responses).toHaveLength(1)
    expect(responses[0]).toEqual(
      expect.objectContaining({
        type: 'cache-response',
        query: expect.objectContaining({ queryKey: ['success'] }),
      }),
    )
    cleanup()
  })

  it('should report errors thrown while dehydrating a response', () => {
    const error = new Error('dehydrate failed')
    const onBroadcastRestoreError = vi.fn()
    queryClient.setQueryData(['dehydrate-error'], 'data')
    const [cleanup] = broadcastQueryClientRestore({
      queryClient,
      broadcastChannel: 'test_channel',
      timeout: 0,
      dehydrateOptions: {
        shouldDehydrateQuery: () => {
          throw error
        },
      },
      onBroadcastRestoreError,
    })

    lastCreatedChannel.onmessage?.({
      type: 'cache-request',
      requestId: 'dehydrate-error-request',
    })

    expect(onBroadcastRestoreError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        type: 'request',
        requestId: 'dehydrate-error-request',
      }),
    )
    cleanup()
  })

  it('should preserve a newer local query when an older snapshot arrives', () => {
    const key = queryKey()
    queryClient.setQueryData(key, 'new-local', { updatedAt: 20 })
    const [cleanup] = broadcastQueryClientRestore({
      queryClient,
      broadcastChannel: 'test_channel',
      timeout: 0,
    })
    const request = mockPostMessage.mock.calls[0]?.[0]

    lastCreatedChannel.onmessage?.({
      type: 'cache-response',
      requestId: request.requestId,
      responderId: 'peer-1',
      responseId: 'old-response',
      query: {
        queryHash: JSON.stringify(key),
        queryKey: key,
        state: { data: 'old-remote', status: 'success', dataUpdatedAt: 10 },
      },
    })

    expect(queryClient.getQueryData(key)).toBe('new-local')
    cleanup()
  })

  it('should resolve using the default timeout when no timeout is provided', async () => {
    vi.useFakeTimers()
    try {
      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
      })
      let didRestore = false
      void restored.then(() => {
        didRestore = true
      })

      await vi.advanceTimersByTimeAsync(999)
      expect(didRestore).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      expect(didRestore).toBe(true)
      cleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should resolve a zero timeout asynchronously without waiting', async () => {
    vi.useFakeTimers()
    try {
      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 0,
      })
      let didRestore = false
      void restored.then(() => {
        didRestore = true
      })

      expect(didRestore).toBe(false)
      await vi.advanceTimersByTimeAsync(0)
      expect(didRestore).toBe(true)
      cleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should ignore malformed live messages without throwing', () => {
    const cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })

    expect(() => {
      lastCreatedChannel.onmessage?.({ type: 'updated' })
      lastCreatedChannel.onmessage?.({
        type: 'updated',
        queryHash: 'not-an-array-key',
        queryKey: 'invalid',
        state: {},
      })
      lastCreatedChannel.onmessage?.({
        type: 'cache-request',
        requestId: 123,
      })
    }).not.toThrow()
    expect(queryCache.getAll()).toHaveLength(0)
    cleanup()
  })

  it('should make cleanup idempotent and close the channel once', () => {
    const cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })

    cleanup()
    cleanup()

    expect(mockClose).toHaveBeenCalledOnce()
    expect(queryCache.hasListeners()).toBe(false)
  })

  it('should report channel close failures through the restore error callback', async () => {
    const error = new Error('close failed')
    const onBroadcastRestoreError = vi.fn()
    mockClose.mockRejectedValueOnce(error)
    const [cleanup] = broadcastQueryClientRestore({
      queryClient,
      broadcastChannel: 'test_channel',
      timeout: 0,
      onBroadcastRestoreError,
    })

    cleanup()
    await sleep(0)

    expect(onBroadcastRestoreError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ type: 'request' }),
    )
  })

  it('should report synchronous channel close failures without throwing from cleanup', () => {
    const error = new Error('synchronous close failed')
    const onBroadcastRestoreError = vi.fn()
    mockClose.mockImplementationOnce(() => {
      throw error
    })
    const [cleanup] = broadcastQueryClientRestore({
      queryClient,
      broadcastChannel: 'test_channel',
      timeout: 0,
      onBroadcastRestoreError,
    })

    expect(() => cleanup()).not.toThrow()
    expect(onBroadcastRestoreError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ type: 'request' }),
    )
  })

  it('should report restore callback failures without creating unhandled errors', () => {
    const dehydrateError = new Error('dehydrate failed')
    const callbackError = new Error('restore callback failed')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    queryClient.setQueryData(['callback-error'], 'data')
    const [cleanup] = broadcastQueryClientRestore({
      queryClient,
      broadcastChannel: 'test_channel',
      timeout: 0,
      dehydrateOptions: {
        shouldDehydrateQuery: () => {
          throw dehydrateError
        },
      },
      onBroadcastRestoreError: () => {
        throw callbackError
      },
    })

    lastCreatedChannel.onmessage?.({
      type: 'cache-request',
      requestId: 'callback-error-request',
    })

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Bootstrap request failed'),
      callbackError,
    )
    warnSpy.mockRestore()
    cleanup()
  })

  it('should report synchronous bootstrap request post failures', () => {
    const error = new Error('synchronous request post failed')
    const onBroadcastRestoreError = vi.fn()
    mockPostMessage.mockImplementationOnce(() => {
      throw error
    })

    const [cleanup] = broadcastQueryClientRestore({
      queryClient,
      broadcastChannel: 'test_channel',
      timeout: 0,
      onBroadcastRestoreError,
    })

    expect(onBroadcastRestoreError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ type: 'request' }),
    )
    cleanup()
  })

  it('should ignore messages delivered after cleanup', () => {
    const key = queryKey()
    const cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })
    const handler = lastCreatedChannel.onmessage
    cleanup()

    handler?.({
      type: 'added',
      queryHash: JSON.stringify(key),
      queryKey: key,
      state: { data: 'late', dataUpdatedAt: 1 },
    })

    expect(queryClient.getQueryData(key)).toBeUndefined()
  })

  it('should build a query for an incoming updated message when it is absent', () => {
    const key = queryKey()
    const cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })

    lastCreatedChannel.onmessage?.({
      type: 'updated',
      queryHash: JSON.stringify(key),
      queryKey: key,
      state: { data: 'updated', dataUpdatedAt: 1 },
    })

    expect(queryClient.getQueryData(key)).toBe('updated')
    cleanup()
  })

  it('should ignore an older incoming added message for an existing query', () => {
    const key = queryKey()
    queryClient.setQueryData(key, 'newer', { updatedAt: 20 })
    const cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })

    lastCreatedChannel.onmessage?.({
      type: 'added',
      queryHash: JSON.stringify(key),
      queryKey: key,
      state: { data: 'older', dataUpdatedAt: 10 },
    })

    expect(queryClient.getQueryData(key)).toBe('newer')
    cleanup()
  })

  it('should apply a newer incoming added message for an existing query', () => {
    const key = queryKey()
    queryClient.setQueryData(key, 'older', { updatedAt: 10 })
    const cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })

    lastCreatedChannel.onmessage?.({
      type: 'added',
      queryHash: JSON.stringify(key),
      queryKey: key,
      state: { data: 'newer', dataUpdatedAt: 20 },
    })

    expect(queryClient.getQueryData(key)).toBe('newer')
    cleanup()
  })

  it('should warn when a restore error has no restore callback', () => {
    const previousNodeEnv = process.env['NODE_ENV']
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    process.env['NODE_ENV'] = 'development'
    queryClient.setQueryData(['restore-warning'], 'data')
    const [cleanup] = broadcastQueryClientRestore({
      queryClient,
      broadcastChannel: 'test_channel',
      timeout: 0,
      dehydrateOptions: {
        shouldDehydrateQuery: () => {
          throw new Error('restore warning')
        },
      },
    })

    lastCreatedChannel.onmessage?.({
      type: 'cache-request',
      requestId: 'restore-warning-request',
    })

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Bootstrap request failed'),
      expect.any(Error),
    )
    cleanup()
    warnSpy.mockRestore()
    process.env['NODE_ENV'] = previousNodeEnv
  })

  it('should answer bootstrap requests from the existing live-sync API', () => {
    const key = queryKey()
    const peerQueryClient = new QueryClient()
    peerQueryClient.setQueryData(key, { from: 'peer' })
    const peerCleanup = broadcastQueryClient({
      queryClient: peerQueryClient,
      broadcastChannel: 'test_channel',
    })

    const peerChannel = createdChannels[0]!
    peerChannel.onmessage?.({
      type: 'cache-request',
      requestId: 'request-1',
    })

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'cache-response',
        requestId: 'request-1',
        query: expect.objectContaining({
          queryKey: key,
        }),
      }),
    )

    peerCleanup()
  })

  it('should resolve restore after a timeout with no peer response', async () => {
    vi.useFakeTimers()
    try {
      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 100,
      })
      let completed = false
      void restored.then(() => {
        completed = true
      })

      expect(completed).toBe(false)
      await vi.advanceTimersByTimeAsync(100)
      expect(completed).toBe(true)
      cleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should settle restore and ignore responses after cleanup', async () => {
    vi.useFakeTimers()
    try {
      const key = queryKey()
      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 100,
      })
      const request = mockPostMessage.mock.calls[0]?.[0]

      cleanup()
      await restored

      lastCreatedChannel.onmessage?.({
        type: 'cache-response',
        requestId: request.requestId,
        responderId: 'peer-1',
        responseId: 'response-1',
        query: {
          queryHash: JSON.stringify(key),
          queryKey: key,
          state: { data: 'late', status: 'success', dataUpdatedAt: 1 },
        },
      })

      expect(queryClient.getQueryData(key)).toBeUndefined()
      expect(mockClose).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should report hydration errors without rejecting restore', async () => {
    vi.useFakeTimers()
    try {
      const key = queryKey()
      const error = new Error('deserialize failed')
      const onBroadcastRestoreError = vi.fn()
      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 100,
        onBroadcastRestoreError,
        hydrateOptions: {
          defaultOptions: {
            deserializeData: () => {
              throw error
            },
          },
        },
      })
      const request = mockPostMessage.mock.calls[0]?.[0]

      lastCreatedChannel.onmessage?.({
        type: 'cache-response',
        requestId: request.requestId,
        responderId: 'peer-1',
        responseId: 'response-1',
        query: {
          queryHash: JSON.stringify(key),
          queryKey: key,
          state: {
            data: 'value',
            status: 'success',
            dataUpdatedAt: 1,
          },
        },
      })

      expect(onBroadcastRestoreError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          type: 'hydrate',
          requestId: request.requestId,
          queryHash: JSON.stringify(key),
        }),
      )
      await vi.advanceTimersByTimeAsync(100)
      await restored
      expect(queryClient.getQueryData(key)).toBeUndefined()
      cleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should not include mutations in a bootstrap response', () => {
    const peerQueryClient = new QueryClient()
    peerQueryClient.getMutationCache().build(
      peerQueryClient,
      {
        mutationKey: ['mutation'],
        mutationFn: () => Promise.resolve('mutation'),
      },
      {
        context: undefined,
        data: undefined,
        error: null,
        failureCount: 0,
        failureReason: null,
        isPaused: true,
        status: 'pending',
        variables: undefined,
        submittedAt: 0,
      },
    )
    const peerCleanup = broadcastQueryClient({
      queryClient: peerQueryClient,
      broadcastChannel: 'test_channel',
    })

    mockPostMessage.mockClear()
    lastCreatedChannel.onmessage?.({
      type: 'cache-request',
      requestId: 'request-1',
    })

    expect(mockPostMessage).not.toHaveBeenCalled()
    peerCleanup()
  })

  it('should reject invalid restore timeout values synchronously', () => {
    expect(() =>
      broadcastQueryClientRestore({
        queryClient,
        timeout: Number.NaN,
      }),
    ).toThrow('timeout must be non-negative')

    expect(() =>
      broadcastQueryClientRestore({
        queryClient,
        timeout: -1,
      }),
    ).toThrow('timeout must be non-negative')
  })

  it('should report bootstrap request failures without leaving restore pending', async () => {
    vi.useFakeTimers()
    try {
      const error = new Error('request failed')
      const onBroadcastRestoreError = vi.fn()
      mockPostMessage.mockRejectedValueOnce(error)

      const [cleanup, restored] = broadcastQueryClientRestore({
        queryClient,
        broadcastChannel: 'test_channel',
        timeout: 100,
        onBroadcastRestoreError,
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(onBroadcastRestoreError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          type: 'request',
        }),
      )

      await vi.advanceTimersByTimeAsync(100)
      await restored
      cleanup()
    } finally {
      vi.useRealTimers()
    }
  })

  it('should isolate a non-cloneable query response from valid responses', async () => {
    const peerQueryClient = new QueryClient()
    peerQueryClient.setQueryData(['bad'], { value: 'bad' })
    peerQueryClient.setQueryData(['good'], { value: 'good' })
    const error = new DOMException('DataCloneError', 'DataCloneError')
    const onBroadcastRestoreError = vi.fn()

    mockPostMessage.mockImplementation((message) => {
      if (
        message.type === 'cache-response' &&
        message.query.queryKey[0] === 'bad'
      ) {
        return Promise.reject(error)
      }
      return Promise.resolve()
    })

    const [cleanup] = broadcastQueryClientRestore({
      queryClient: peerQueryClient,
      broadcastChannel: 'test_channel',
      timeout: 100,
      onBroadcastRestoreError,
    })

    lastCreatedChannel.onmessage?.({
      type: 'cache-request',
      requestId: 'request-1',
    })

    await sleep(0)
    expect(onBroadcastRestoreError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        type: 'response',
        queryHash: JSON.stringify(['bad']),
      }),
    )
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'cache-response',
        query: expect.objectContaining({
          queryKey: ['good'],
        }),
      }),
    )
    cleanup()
  })

  it('should not create an unhandled rejection from restore error callbacks', async () => {
    vi.useFakeTimers()
    try {
      const error = new Error('request failed')
      const unhandledRejections: Array<unknown> = []
      const onUnhandledRejection = (reason: unknown) => {
        unhandledRejections.push(reason)
      }
      process.on('unhandledRejection', onUnhandledRejection)
      mockPostMessage.mockRejectedValueOnce(error)

      try {
        const [cleanup, restored] = broadcastQueryClientRestore({
          queryClient,
          broadcastChannel: 'test_channel',
          timeout: 100,
          onBroadcastRestoreError: () =>
            Promise.reject(new Error('callback failed')),
        })

        await vi.advanceTimersByTimeAsync(100)
        await restored
        cleanup()
        expect(unhandledRejections).toHaveLength(0)
      } finally {
        process.off('unhandledRejection', onUnhandledRejection)
      }
    } finally {
      vi.useRealTimers()
    }
  })

  describe('incoming message handling', () => {
    it('should keep broadcasting local changes after applying an incoming message throws', () => {
      const remoteKey = queryKey()
      const localKey = queryKey()

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

      expect(mockPostMessage).toHaveBeenCalled()
    })

    it('should keep broadcasting local changes after query.setState throws for an existing query', () => {
      const existingKey = queryKey()
      const localKey = queryKey()

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

    it('should call onBroadcastError when postMessage throws synchronously', async () => {
      const key = queryKey()
      const cloneError = new DOMException('DataCloneError', 'DataCloneError')
      mockPostMessage.mockImplementationOnce(() => {
        throw cloneError
      })

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
