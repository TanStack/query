import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { streamedQuery } from '../streamedQuery'
import { QueryObserver } from '..'
import { createQueryClient, queryKey, sleep } from './utils'
import type { QueryClient } from '..'

describe('streamedQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = createQueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  function createAsyncNumberGenerator(amount: number) {
    return {
      async *[Symbol.asyncIterator]() {
        let num = 0
        while (num < amount) {
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
})
