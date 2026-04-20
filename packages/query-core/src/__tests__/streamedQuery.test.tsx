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

  it('should not call reducer twice when refetchMode is replace', async () => {
    const key = queryKey()
    const arr: Array<number> = []

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
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
