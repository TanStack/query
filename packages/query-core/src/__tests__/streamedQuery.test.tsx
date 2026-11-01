import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createKey, sleep } from '@tanstack/query-test-utils'
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
    const key = createKey()
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
    const key = createKey()
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
    const key = createKey()

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
    const key = createKey()
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
    const key = createKey()
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
    const key = createKey()
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
    const key = createKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: (context) => {
          // just consume the signal
          void context.signal
          return createAsyncNumberGenerator(3)
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
    const key = createKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: (context) => {
          // just consume the signal
          void context.signal
          return createAsyncNumberGenerator(3)
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
    const key = createKey()
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

  it.each(['append', 'replace'] as const)(
    'should stop %s writes after explicit cancellation without consuming the signal',
    async (refetchMode) => {
      const key = createKey()
      queryClient.setQueryData(key, [99])
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: streamedQuery({
          streamFn: () => createAsyncNumberGenerator(3),
          refetchMode,
        }),
      })

      const unsubscribe = observer.subscribe(vi.fn())
      await vi.advanceTimersByTimeAsync(50)
      await queryClient.cancelQueries({ queryKey: key })
      const cancelledData = queryClient.getQueryData(key)
      expect(cancelledData).toStrictEqual(
        refetchMode === 'append' ? [99, 0] : [99],
      )

      await vi.advanceTimersByTimeAsync(150)
      expect(queryClient.getQueryData(key)).toStrictEqual(cancelledData)
      unsubscribe()
    },
  )

  it('should preserve a non-streamed replacement when the old stream ignores the signal', async () => {
    const key = createKey()
    const queryFn = streamedQuery({
      streamFn: () => createAsyncNumberGenerator(3),
    })
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: (context) => queryFn(context),
    })

    const unsubscribe = observer.subscribe(vi.fn())
    await vi.advanceTimersByTimeAsync(50)
    observer.setOptions({ queryKey: key, queryFn: () => [100] })
    await observer.refetch()
    await vi.advanceTimersByTimeAsync(150)

    expect(queryClient.getQueryData(key)).toStrictEqual([100])
    unsubscribe()
  })

  it('should preserve the new stream when the old stream ignores the signal', async () => {
    const key = createKey()
    let offset = 0
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: () => {
          const stream = createAsyncNumberGenerator(3, offset)
          offset += 100
          return stream
        },
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())
    await vi.advanceTimersByTimeAsync(50)
    void observer.refetch()
    await vi.advanceTimersByTimeAsync(150)

    expect(queryClient.getQueryData(key)).toStrictEqual([100, 101, 102])
    unsubscribe()
  })

  it('should ignore a chunk queued just before cancellation', async () => {
    const key = createKey()
    queryClient.setQueryData(key, [99])
    let resolveChunk: (chunk: IteratorResult<number>) => void = () => {
      throw new Error('The iterator has not started')
    }
    const next = vi.fn<() => Promise<IteratorResult<number>>>(
      () =>
        new Promise<IteratorResult<number>>((resolve) => {
          resolveChunk = resolve
        }),
    )
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        refetchMode: 'append',
        streamFn: () => ({
          [Symbol.asyncIterator]: () => ({ next }),
        }),
      }),
    })

    const unsubscribe = observer.subscribe(vi.fn())
    await vi.advanceTimersByTimeAsync(0)
    resolveChunk({ done: false, value: 1 })
    void queryClient.cancelQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(0)

    expect(queryClient.getQueryData(key)).toStrictEqual([99])
    expect(next).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it.each(['queryFn', 'persister'] as const)(
    'should not start a stream after cancellation during a delayed %s',
    async (delayIn) => {
      const key = createKey()
      queryClient.setQueryData(key, [99])
      const streamFn = vi.fn<() => AsyncIterable<number>>(() =>
        createAsyncNumberGenerator(1),
      )
      const queryFn = streamedQuery({ streamFn })
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn:
          delayIn === 'queryFn'
            ? async (context) => {
                await sleep(50)
                return queryFn(context)
              }
            : queryFn,
        persister:
          delayIn === 'persister'
            ? async (fn, context) => {
                await sleep(50)
                return fn(context)
              }
            : undefined,
      })

      const unsubscribe = observer.subscribe(vi.fn())
      await queryClient.cancelQueries({ queryKey: key })
      queryClient.setQueryData(key, [100])
      await vi.advanceTimersByTimeAsync(100)

      expect(streamFn).not.toHaveBeenCalled()
      expect(queryClient.getQueryData(key)).toStrictEqual([100])
      unsubscribe()
    },
  )

  it('should keep a custom signal getter lazy', async () => {
    const key = createKey()
    const controller = new AbortController()
    const getSignal = vi.fn<() => AbortSignal>(() => controller.signal)
    const queryFn = streamedQuery({
      streamFn: () => createAsyncNumberGenerator(1),
    })

    const result = queryFn({
      client: queryClient,
      queryKey: key,
      meta: undefined,
      get signal() {
        return getSignal()
      },
    })
    await vi.advanceTimersByTimeAsync(50)

    await expect(result).resolves.toStrictEqual([0])
    expect(getSignal).not.toHaveBeenCalled()
  })

  it('should support custom reducer', async () => {
    const key = createKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        streamFn: () => createAsyncNumberGenerator(2),
        reducer: (acc, chunk) => ({
          ...acc,
          [chunk]: true,
        }),
        initialValue: {},
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
    const key = createKey()
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
        },
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

  it('should preserve null returned by a custom reducer', async () => {
    const key = createKey()
    const data = await queryClient.query({
      queryKey: key,
      queryFn: streamedQuery<number, string | null>({
        initialValue: 'initial',
        reducer: () => null,
        // oxlint-disable-next-line typescript/require-await -- 'streamFn' needs an async iterable, and this generator has nothing to await
        streamFn: async function* () {
          yield 1
        },
      }),
    })
    expect(data).toBeNull()
    expect(queryClient.getQueryData(key)).toBeNull()
  })

  it('should keep error state on reset refetch when initialData is defined', async () => {
    const key = createKey()
    let shouldError = false
    const error = new Error('stream failed')

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      initialData: ['initial'],
      retry: false,
      queryFn: streamedQuery({
        refetchMode: 'reset',
        // oxlint-disable-next-line typescript/require-await -- 'streamFn' needs an async iterable, and this generator has nothing to await
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
    const key = createKey()
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
    const key = createKey()
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
    const key = createKey()
    const arr: Array<number> = []

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        // oxlint-disable-next-line typescript/require-await -- 'streamFn' needs an async iterable, and this generator has nothing to await
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
    expect(arr).toStrictEqual([1, 2, 3])
    expect(observer.getCurrentResult().data).toStrictEqual([1, 2, 3])

    void observer.refetch()
    await vi.advanceTimersByTimeAsync(0)
    expect(arr).toStrictEqual([1, 2, 3, 1, 2, 3])
    expect(observer.getCurrentResult().data).toStrictEqual([1, 2, 3])

    unsubscribe()
  })
})
