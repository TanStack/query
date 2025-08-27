import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
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

  test('should stream data from an AsyncIterable', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        queryFn: () => createAsyncNumberGenerator(3),
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

  test('should allow Arrays to be returned from the stream', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        queryFn: async function* () {
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

  test('should replace on refetch', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        queryFn: () => createAsyncNumberGenerator(2),
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

  test('should support refetchMode append', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        queryFn: () => createAsyncNumberGenerator(2),
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

  test('should support refetchMode replace', async () => {
    const key = queryKey()
    let offset = 0
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        queryFn: () => createAsyncNumberGenerator(2, offset),
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

  test('should abort ongoing stream when refetch happens', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery({
        queryFn: () => createAsyncNumberGenerator(3),
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

  test('should support custom reducer', async () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery<number, Record<number, boolean>>({
        queryFn: () => createAsyncNumberGenerator(2),
        reducer: (acc, chunk) => ({
          ...acc,
          [chunk]: true,
        }),
        initialValue: {}
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

  test('should support custom reducer with initialValue', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: streamedQuery<number, Record<number, boolean>>({
        queryFn: () => createAsyncNumberGenerator(2),
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
})
