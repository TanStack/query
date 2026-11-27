import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MutationObserver,
  QueryClient,
  QueryObserver,
  environmentManager,
  focusManager,
  refetchInterval,
} from '..'

const wasServer = environmentManager.isServer()

describe('refetchInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    environmentManager.setIsServer(() => false)
    focusManager.setFocused(true)
  })

  afterEach(() => {
    focusManager.setFocused(undefined)
    environmentManager.setIsServer(() => wasServer)
    vi.useRealTimers()
  })

  it('keeps the timer cadence on rerender and stops on option removal or unsubscribe', async () => {
    const queryFn = vi.fn<() => number>(() => 1)
    const options = {
      queryKey: ['orders'],
      queryFn,
      initialData: 1,
      staleTime: Infinity,
    }
    const observer = new QueryObserver(new QueryClient(), {
      ...options,
      refetchInterval: refetchInterval(100),
    })
    const unsubscribe = observer.subscribe(() => {})
    await vi.advanceTimersByTimeAsync(90)
    observer.setOptions({ ...options, refetchInterval: refetchInterval(100) })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)

    observer.setOptions({ ...options, refetchInterval: refetchInterval(50) })
    await vi.advanceTimersByTimeAsync(50)
    expect(queryFn).toHaveBeenCalledTimes(2)
    observer.setOptions(options)
    await vi.advanceTimersByTimeAsync(100)
    expect(queryFn).toHaveBeenCalledTimes(2)

    observer.setOptions({ ...options, refetchInterval: refetchInterval(50) })
    unsubscribe()
    await vi.advanceTimersByTimeAsync(100)
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('respects data-dependent intervals, background changes and disabled observers', async () => {
    const queryFn = vi.fn<() => number>(() => 2)
    const options = {
      queryKey: ['orders'],
      queryFn,
      initialData: 1,
      staleTime: Infinity,
    }
    const client = new QueryClient()
    const observer = new QueryObserver(client, {
      ...options,
      refetchInterval: (query) =>
        refetchInterval(query.state.data === 1 ? 100 : false),
    })
    const unsubscribe = observer.subscribe(() => {})
    focusManager.setFocused(false)
    await vi.advanceTimersByTimeAsync(100)
    expect(queryFn).not.toHaveBeenCalled()
    observer.setOptions({
      ...observer.options,
      refetchIntervalInBackground: true,
    })
    await vi.advanceTimersByTimeAsync(300)
    expect(queryFn).toHaveBeenCalledTimes(1)
    observer.setOptions({
      ...observer.options,
      enabled: false,
      refetchInterval: refetchInterval(100),
    })
    await vi.advanceTimersByTimeAsync(100)
    expect(queryFn).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('shares a default polling option without sharing its timers', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { refetchInterval: refetchInterval(60), staleTime: Infinity },
      },
    })
    const first = vi.fn<() => number>(() => 1)
    const second = vi.fn<() => number>(() => 2)
    const a = new QueryObserver(client, {
      queryKey: ['a'],
      queryFn: first,
      initialData: 1,
    })
    const b = new QueryObserver(client, {
      queryKey: ['b'],
      queryFn: second,
      initialData: 2,
    })
    const unsubscribeA = a.subscribe(() => {})
    const unsubscribeB = b.subscribe(() => {})
    await vi.advanceTimersByTimeAsync(60)
    unsubscribeA()
    await vi.advanceTimersByTimeAsync(60)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(2)
    unsubscribeB()
  })

  it('keeps server rendering free of polling timers', async () => {
    environmentManager.setIsServer(() => true)
    const queryFn = vi.fn<() => number>(() => 1)
    const observer = new QueryObserver(new QueryClient(), {
      queryKey: ['orders'],
      queryFn,
      initialData: 1,
      staleTime: Infinity,
      refetchInterval: refetchInterval(100),
    })
    const unsubscribe = observer.subscribe(() => {})
    await vi.advanceTimersByTimeAsync(500)
    expect(queryFn).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('supports mutations and infinite queries on a default client', async () => {
    const client = new QueryClient()
    const mutation = new MutationObserver(client, {
      mutationFn: () => Promise.resolve(42),
    })
    await expect(mutation.mutate()).resolves.toBe(42)
    await expect(
      client.infiniteQuery({
        queryKey: ['pages'],
        initialPageParam: 1,
        pages: 2,
        queryFn: ({ pageParam }) => pageParam,
        getNextPageParam: (page) => page + 1,
      }),
    ).resolves.toStrictEqual({ pages: [1, 2], pageParams: [1, 2] })
  })
})
