import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { streamedQuery } from '../streamedQuery'
import { QueryClient, QueryObserver } from '..'

describe('streamedQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  function createAsyncNumberGenerator(amount: number, start = 0) {
    return {
      async *[Symbol.asyncIterator]() {
        let num = start
        while (num < amount + start) {
          await sleep(50)
          yield num++
        }
      },
    }
  }

  it('should stream data from an AsyncIterable', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: () => createAsyncNumberGenerator(3),
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0],
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0, 1],
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [0, 1, 2],
    })

    unsubscribe()
  })

  it('should allow Arrays to be returned from the stream', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: async function* () {
          for await (const num of createAsyncNumberGenerator(3)) {
            yield [num, num] as const
          }
        },
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [[0, 0]],
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [
        [0, 0],
        [1, 1],
      ],
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    })

    unsubscribe()
  })

  it('should handle empty streams', async () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: async function* () {},
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [],
    })

    unsubscribe()
  })

  it('should replace on refetch', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: () => createAsyncNumberGenerator(2),
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(100)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [0, 1],
    })

    void observer.refetch()

    await vi.advanceTimersByTimeAsync(10)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(40)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0],
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [0, 1],
    })

    unsubscribe()
  })

  it('should support refetchMode append', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: () => createAsyncNumberGenerator(2),
        refetchMode: 'append',
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(100)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [0, 1],
    })

    void observer.refetch()

    await vi.advanceTimersByTimeAsync(10)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0, 1],
    })

    await vi.advanceTimersByTimeAsync(40)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0, 1, 0],
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [0, 1, 0, 1],
    })

    unsubscribe()
  })

  it('should support refetchMode replace', async () => {
    const key = queryKey()
    let offset = 0
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: () => createAsyncNumberGenerator(2, offset),
        refetchMode: 'replace',
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(100)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [0, 1],
    })

    offset = 100

    void observer.refetch()

    await vi.advanceTimersByTimeAsync(10)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0, 1],
    })

    await vi.advanceTimersByTimeAsync(40)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0, 1],
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [100, 101],
    })

    unsubscribe()
  })

  it('should abort ongoing stream when refetch happens', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: (context) => {
          // just consume the signal
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          const numbers = context.signal ? 3 : 0
          return createAsyncNumberGenerator(numbers)
        },
        refetchMode: 'append',
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(100)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0, 1],
    })

    void observer.refetch()

    await vi.advanceTimersByTimeAsync(10)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0, 1],
    })

    await vi.advanceTimersByTimeAsync(40)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0, 1, 0],
    })

    await vi.advanceTimersByTimeAsync(100)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [0, 1, 0, 1, 2],
    })

    unsubscribe()
  })

  it('should abort when unsubscribed', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: (context) => {
          // just consume the signal
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          const numbers = context.signal ? 3 : 0
          return createAsyncNumberGenerator(numbers)
        },
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    expect(queryClient.getQueryState(key)).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(60)

    expect(queryClient.getQueryState(key)).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0],
    })

    unsubscribe()

    await vi.advanceTimersByTimeAsync(10)

    expect(queryClient.getQueryState(key)).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [0],
    })
  })

  it('should not abort when signal not consumed', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: () => createAsyncNumberGenerator(3),
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    expect(queryClient.getQueryState(key)).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(60)

    expect(queryClient.getQueryState(key)).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0],
    })

    unsubscribe()

    await vi.advanceTimersByTimeAsync(50)

    expect(queryClient.getQueryState(key)).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: [0, 1],
    })
  })

  it('should support custom reducer', async () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: () => createAsyncNumberGenerator(2),
        reducer: (acc, chunk) => ({
          ...acc,
          [chunk]: true,
        }),
        initialValue: {} as Record<number, boolean>,
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(100)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: {
        0: true,
        1: true,
      },
    })

    unsubscribe()
  })

  it('should support custom reducer with initialValue', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: () => createAsyncNumberGenerator(2),
        reducer: (acc, chunk) => ({
          ...acc,
          [chunk]: true,
        }),
        initialValue: {
          10: true,
          11: true,
        } as Record<number, boolean>,
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await vi.advanceTimersByTimeAsync(100)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: {
        10: true,
        11: true,
        0: true,
        1: true,
      },
    })

    unsubscribe()
  })

  it('should keep error state on reset refetch when initialData is defined', async () => {
    const key = queryKey()
    let shouldError = false
    const error = new Error('stream failed')

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      initialData: ['initial'],
      retry: false,
      queryFn: streamedQuery({
        refetchMode: 'reset',
        // eslint-disable-next-line @typescript-eslint/require-await
        streamFn: async function* () {
          if (shouldError) {
            throw error
          }

          yield 0
        },
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    await vi.advanceTimersByTimeAsync(0)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: ['initial', 0],
    })

    shouldError = true

    const refetchPromise = observer.refetch()

    await vi.advanceTimersByTimeAsync(0)
    await expect(refetchPromise).resolves.toMatchObject({
      status: 'error',
      error,
      data: ['initial'],
    })

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'error',
      fetchStatus: 'idle',
      data: ['initial'],
      error,
    })

    unsubscribe()
  })

  it('should treat a fetch after an initial error as a refetch for reset mode', async () => {
    const key = queryKey()
    let shouldError = true
    const error = new Error('stream failed')

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      retry: false,
      queryFn: streamedQuery({
        refetchMode: 'reset',
        streamFn: async function* () {
          if (shouldError) {
            throw error
          }

          yield* createAsyncNumberGenerator(1)
        },
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    await vi.advanceTimersByTimeAsync(0)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'error',
      fetchStatus: 'idle',
      data: undefined,
      error,
    })

    shouldError = false

    void observer.refetch()

    await vi.advanceTimersByTimeAsync(0)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
      error: null,
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: [0],
      error: null,
    })

    unsubscribe()
  })

  it('should reset to initialData on refetch after an initial error', async () => {
    const key = queryKey()
    let shouldError = true
    const error = new Error('stream failed')

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      initialData: ['initial'],
      retry: false,
      queryFn: streamedQuery({
        refetchMode: 'reset',
        streamFn: async function* () {
          if (shouldError) {
            throw error
          }

          yield* createAsyncNumberGenerator(1)
        },
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    await vi.advanceTimersByTimeAsync(0)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'error',
      fetchStatus: 'idle',
      data: ['initial'],
      error,
    })

    shouldError = false

    void observer.refetch()

    await vi.advanceTimersByTimeAsync(0)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: ['initial'],
      error: null,
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: ['initial', 0],
      error: null,
    })

    unsubscribe()
  })

  it('should not let an orphaned stream write to the cache after a refetch when the signal is not consumed', async () => {
    const key = queryKey()

    let callCount = 0
    // First fetch: two chunks. The first resolves immediately (giving the
    // query defined data, which is what makes `refetch({cancelRefetch:true})`
    // actually cancel-and-restart instead of just reusing the pending fetch).
    // The second stays pending until we manually resolve it later, simulating
    // a still-in-flight chunk at the moment a refetch happens.
    let resolveFirstFetchChunk2: (value: number) => void = () => undefined
    const firstFetchChunk2Pending = new Promise<number>((resolve) => {
      resolveFirstFetchChunk2 = resolve
    })
    let resolveSecondFetchChunk: (value: number) => void = () => undefined
    const secondFetchChunkPending = new Promise<number>((resolve) => {
      resolveSecondFetchChunk = resolve
    })

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        refetchMode: 'reset',
        // Does NOT touch context.signal, matching third-party streaming
        // SDKs that don't accept an AbortSignal to plumb through.
        streamFn: async function* () {
          callCount++
          if (callCount === 1) {
            yield 0
            yield await firstFetchChunk2Pending
          } else {
            yield await secondFetchChunkPending
          }
        },
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())
    await vi.advanceTimersByTimeAsync(0)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      data: [0],
    })

    // Refetch while the first fetch's generator is still alive, awaiting its
    // second chunk. cancelRefetch defaults to true and data is now defined,
    // so this actually cancels-and-restarts (unlike before the first chunk).
    void observer.refetch()
    await vi.advanceTimersByTimeAsync(0)

    expect(callCount).toBe(2)
    expect(observer.getCurrentResult()).toMatchObject({
      status: 'pending',
      data: undefined,
    })

    resolveSecondFetchChunk(100)
    await vi.advanceTimersByTimeAsync(0)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      data: [100],
    })

    // The first fetch was "cancelled" by the refetch above, but its
    // streamFn was never told (it never read context.signal), so it is
    // still running and now delivers its stale second chunk.
    resolveFirstFetchChunk2(1)
    await vi.advanceTimersByTimeAsync(0)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      data: [100],
    })

    unsubscribe()
  })

  it('should not let a superseded refetchMode "replace" stream finalize its stale result into the cache', async () => {
    const key = queryKey()

    let callCount = 0
    let resolveSecondFetchChunk: (value: number) => void = () => undefined
    const secondFetchChunkPending = new Promise<number>((resolve) => {
      resolveSecondFetchChunk = resolve
    })
    let resolveThirdFetchChunk: (value: number) => void = () => undefined
    const thirdFetchChunkPending = new Promise<number>((resolve) => {
      resolveThirdFetchChunk = resolve
    })

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        refetchMode: 'replace',
        // Does NOT touch context.signal, matching third-party streaming
        // SDKs that don't accept an AbortSignal to plumb through.
        streamFn: async function* () {
          callCount++
          if (callCount === 1) {
            // initial mount: not a refetch, so this writes directly and
            // finishes immediately, giving the query defined data
            yield 0
          } else if (callCount === 2) {
            // first refetch: this is the one that will get superseded
            // while still accumulating its (never-to-be-written) result
            yield await secondFetchChunkPending
          } else {
            yield await thirdFetchChunkPending
          }
        },
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())
    await vi.advanceTimersByTimeAsync(0)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      data: [0],
    })

    // first refetch: isReplaceRefetch is true for this invocation, it starts
    // accumulating internally instead of writing per-chunk
    void observer.refetch()
    await vi.advanceTimersByTimeAsync(0)
    expect(callCount).toBe(2)

    // second refetch, superseding the first one while it's still awaiting
    // its own chunk
    void observer.refetch()
    await vi.advanceTimersByTimeAsync(0)
    expect(callCount).toBe(3)

    resolveThirdFetchChunk(100)
    await vi.advanceTimersByTimeAsync(0)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      data: [100],
    })

    // the first refetch's stream was superseded before it ever wrote
    // anything (replace mode only writes once, at the end), but it is
    // still running and now resolves its own chunk. Its finalize write
    // must be skipped, it must not overwrite the current, correct result.
    resolveSecondFetchChunk(1)
    await vi.advanceTimersByTimeAsync(0)

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      data: [100],
    })

    unsubscribe()
  })

  it('should not call reducer twice when refetchMode is replace', async () => {
    const key = queryKey()
    const arr: Array<number> = []

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        // eslint-disable-next-line @typescript-eslint/require-await
        streamFn: async function* () {
          const v = [1, 2, 3]
          yield* v
        },
        reducer: (oldStream, newChunk) => {
          arr.push(newChunk)
          return [...oldStream, newChunk]
        },
        initialValue: [] as Array<number>,
        refetchMode: 'replace',
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())

    await vi.advanceTimersByTimeAsync(0)

    expect(arr).toEqual([1, 2, 3])
    expect(observer.getCurrentResult().data).toEqual([1, 2, 3])

    void observer.refetch()

    await vi.advanceTimersByTimeAsync(0)

    expect(arr).toEqual([1, 2, 3, 1, 2, 3])
    expect(observer.getCurrentResult().data).toEqual([1, 2, 3])

    unsubscribe()
  })
})
