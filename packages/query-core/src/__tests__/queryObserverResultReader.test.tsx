import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  InfiniteQueryObserver,
  QueryClient,
  QueryObserver,
  onlineManager,
} from '..'
import type { DefaultedInfiniteQueryObserverOptions, InfiniteData } from '..'

describe('query observer result readers', () => {
  let client: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    client = new QueryClient()
  })

  afterEach(() => {
    client.clear()
    onlineManager.setOnline(true)
    vi.useRealTimers()
  })

  it('isolates interleaved readers from the subscribed query and its selection memo', () => {
    const keyA = queryKey()
    const keyB = queryKey()
    client.setQueryData(keyA, { value: 1 })
    client.setQueryData(keyB, { value: 2 })
    const select = vi.fn((data: { value: number }) => ({
      selected: data.value,
    }))
    const options = client.defaultQueryOptions({
      queryKey: keyA,
      enabled: false,
      select,
    })
    const observer = new QueryObserver(client, options)
    const listener = vi.fn()
    const unsubscribe = observer.subscribe(listener)
    const current = observer.getCurrentResult()
    const query = observer.getCurrentQuery()
    const committedOptions = observer.options
    const cacheListener = vi.fn()
    const unsubscribeCache = client.getQueryCache().subscribe(cacheListener)
    const readerA = observer.createResultReader(options)
    const readerB = observer.createResultReader(
      client.defaultQueryOptions({
        ...options,
        queryKey: keyB,
        queryHash: undefined,
        select: (data) => ({ selected: data.value * 10 }),
      }),
    )

    expect(readerB.getSnapshot().data).toEqual({ selected: 20 })
    expect(readerA.getSnapshot()).toBe(current)
    expect(observer.getCurrentResult()).toBe(current)
    expect(observer.getCurrentQuery()).toBe(query)
    expect(observer.options).toBe(committedOptions)
    expect(query.observers).toEqual([observer])
    expect(client.getQueryCache().find({ queryKey: keyB })!.observers).toEqual(
      [],
    )
    expect(listener).not.toHaveBeenCalled()
    expect(cacheListener).not.toHaveBeenCalled()
    observer.updateResult()
    expect(select).toHaveBeenCalledTimes(1)

    client.setQueryData(keyA, { value: 3 })
    expect(readerA.getSnapshot().data).toEqual({ selected: 3 })
    expect(readerB.getSnapshot().data).toEqual({ selected: 20 })
    expect(observer.getCurrentResult().data).toEqual({ selected: 3 })
    expect(select).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenCalledTimes(1)

    readerB.commit()
    expect(observer.getCurrentQuery().queryKey).toEqual(keyB)
    expect(observer.getCurrentResult().data).toEqual({ selected: 20 })
    expect(query.observers).toEqual([])
    expect(observer.getCurrentQuery().observers).toEqual([observer])
    listener.mockClear()
    client.setQueryData(keyA, { value: 4 })
    expect(listener).not.toHaveBeenCalled()
    client.setQueryData(keyB, { value: 5 })
    expect(readerB.getSnapshot().data).toEqual({ selected: 50 })
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribeCache()
    unsubscribe()
  })

  it('retains its snapshot when a subscription starts the predicted fetch', async () => {
    const queryFn = vi.fn(() => sleep(10).then(() => ({ value: 1 })))
    const options = client.defaultQueryOptions({
      queryKey: queryKey(),
      queryFn,
      _optimisticResults: 'optimistic',
    })
    const observer = new QueryObserver(client, options)
    const reader = observer.createResultReader(options)
    const snapshot = reader.getSnapshot()
    expect(snapshot).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
    })
    expect(queryFn).not.toHaveBeenCalled()
    const unsubscribe = observer.subscribe(vi.fn())
    expect(reader.getSnapshot()).toBe(snapshot)
    reader.commit()
    expect(reader.getSnapshot()).toBe(snapshot)
    expect(queryFn).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10)
    const success = reader.getSnapshot()
    expect(success).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: { value: 1 },
    })
    expect(success).not.toBe(snapshot)
    expect(reader.getSnapshot()).toBe(success)
    unsubscribe()
  })

  it('exposes retry failures, terminal errors, and recovery', async () => {
    const error = new Error('fetch failed')
    let attempts = 0
    const options = client.defaultQueryOptions({
      queryKey: queryKey(),
      queryFn: async () => {
        await sleep(10)
        if (++attempts <= 2) throw error
        return 'recovered'
      },
      retry: 1,
      retryDelay: 10,
      _optimisticResults: 'optimistic',
    })
    const observer = new QueryObserver(client, options)
    const reader = observer.createResultReader(options)
    const unsubscribe = observer.subscribe(vi.fn())
    await vi.advanceTimersByTimeAsync(10)
    expect(reader.getSnapshot()).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      failureCount: 1,
      failureReason: error,
    })
    await vi.advanceTimersByTimeAsync(20)
    const failed = reader.getSnapshot()
    expect(failed).toMatchObject({
      status: 'error',
      fetchStatus: 'idle',
      error,
      failureCount: 2,
    })
    expect(reader.getSnapshot()).toBe(failed)
    const refetch = failed.refetch()
    expect(reader.getSnapshot().fetchStatus).toBe('fetching')
    await vi.advanceTimersByTimeAsync(10)
    await refetch
    expect(reader.getSnapshot()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'recovered',
      error: null,
      failureCount: 0,
    })
    unsubscribe()
  })

  it('keeps selector failures local and returns a stable error snapshot', async () => {
    const options = client.defaultQueryOptions({
      queryKey: queryKey(),
      initialData: { value: 1 },
      enabled: false,
      select: (data: { value: number }) => data.value,
    })
    const observer = new QueryObserver(client, options)
    const current = observer.getCurrentResult()
    const error = new Error('selection failed')
    const select = vi.fn(() => {
      throw error
    })
    const reader = observer.createResultReader({ ...options, select })
    const snapshot = reader.getSnapshot()
    await vi.advanceTimersByTimeAsync(10)
    expect(reader.getSnapshot()).toBe(snapshot)
    expect(snapshot.error).toBe(error)
    expect(select).toHaveBeenCalledTimes(1)
    expect(observer.getCurrentResult()).toBe(current)
    observer.updateResult()
    expect(observer.getCurrentResult()).toBe(current)
  })

  it('reuses a subscription selection made after the last snapshot read', () => {
    const key = queryKey()
    client.setQueryData(key, { value: 1 })
    const select = vi.fn((data: { value: number }) => ({
      selected: data.value,
    }))
    const options = client.defaultQueryOptions({
      queryKey: key,
      enabled: false,
      select,
      structuralSharing: false,
    })
    const observer = new QueryObserver(client, options)
    const listener = vi.fn()
    const unsubscribe = observer.subscribe(listener)
    const reader = observer.createResultReader(options)
    expect(reader.getSnapshot().data).toEqual({ selected: 1 })

    // The subscription selects the new data before the reader commits.
    client.setQueryData(key, { value: 2 })
    const updated = observer.getCurrentResult()
    expect(updated.data).toEqual({ selected: 2 })
    expect(select).toHaveBeenCalledTimes(2)
    listener.mockClear()

    reader.commit()

    expect(select).toHaveBeenCalledTimes(2)
    expect(observer.getCurrentResult().data).toBe(updated.data)
    expect(reader.getSnapshot().data).toBe(updated.data)
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('rechecks data before commit and reuses the reader selection', () => {
    const key = queryKey()
    client.setQueryData(key, { value: 1 })
    const select = vi.fn((data: { value: number }) => ({
      selected: data.value,
    }))
    const options = client.defaultQueryOptions({
      queryKey: key,
      enabled: false,
      select,
    })
    const observer = new QueryObserver(client, options)
    const reader = observer.createResultReader(options)
    expect(reader.getSnapshot().data).toEqual({ selected: 1 })
    client.setQueryData(key, { value: 2 })
    reader.commit()
    const snapshot = reader.getSnapshot()
    expect(snapshot.data).toEqual({ selected: 2 })
    expect(observer.getCurrentResult().data).toBe(snapshot.data)
    expect(select).toHaveBeenCalledTimes(2)
  })

  it('caches placeholder selection failures across snapshot reads', async () => {
    const options = client.defaultQueryOptions({
      queryKey: queryKey(),
      queryFn: () => ({ value: 1 }),
      enabled: false,
      select: (data: { value: number }) => data.value,
    })
    const observer = new QueryObserver(client, options)
    const placeholderData = vi.fn(() => ({ value: 2 }))
    const select = vi.fn((): number => {
      throw new Error('placeholder selection failed')
    })
    const reader = observer.createResultReader({
      ...options,
      placeholderData,
      select,
    })
    const snapshot = reader.getSnapshot()
    await vi.advanceTimersByTimeAsync(10)
    expect(reader.getSnapshot()).toBe(snapshot)
    expect(select).toHaveBeenCalledTimes(1)
    expect(placeholderData).toHaveBeenCalledTimes(1)
  })

  it('commits a new selector without selecting again or changing the data reference', () => {
    const options = client.defaultQueryOptions({
      queryKey: queryKey(),
      initialData: { value: 1 },
      enabled: false,
      select: (data: { value: number }) => ({ selected: data.value }),
    })
    const observer = new QueryObserver(client, options)
    const select = vi.fn((data: { value: number }) => ({
      selected: data.value * 10,
    }))
    const listener = vi.fn()
    const unsubscribe = observer.subscribe(listener)
    const reader = observer.createResultReader({ ...options, select })
    const snapshot = reader.getSnapshot()
    reader.commit()
    expect(observer.getCurrentResult().data).toBe(snapshot.data)
    expect(reader.getSnapshot()).toBe(snapshot)
    expect(select).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledExactlyOnceWith(snapshot)
    unsubscribe()
  })

  it('keeps placeholder memoization and previous-query history local', () => {
    const options = client.defaultQueryOptions({
      queryKey: queryKey(),
      initialData: { value: 1 },
      enabled: false,
    })
    const observer = new QueryObserver(client, options)
    const previousQuery = observer.getCurrentQuery()
    const placeholderData = vi.fn((data: { value: number } | undefined) => data)
    const reader = observer.createResultReader(
      client.defaultQueryOptions({
        ...options,
        queryHash: undefined,
        initialData: undefined,
        queryKey: queryKey(),
        enabled: false,
        placeholderData,
      }),
    )
    const snapshot = reader.getSnapshot()
    expect(snapshot).toMatchObject({
      data: { value: 1 },
      isPlaceholderData: true,
    })
    expect(reader.getSnapshot()).toBe(snapshot)
    expect(placeholderData).toHaveBeenCalledExactlyOnceWith(
      previousQuery.state.data,
      previousQuery,
    )
    expect(observer.getCurrentQuery()).toBe(previousQuery)
    expect(observer.getCurrentResult().isPlaceholderData).toBe(false)
  })

  it('recomputes placeholder data after it was removed', () => {
    let value = 0
    const placeholderData = vi.fn(() => ({ value: ++value }))
    const options = client.defaultQueryOptions<{ value: number }>({
      queryKey: queryKey(),
      queryFn: () => ({ value: 0 }),
      enabled: false,
      placeholderData,
    })
    const observer = new QueryObserver(client, options)
    expect(observer.createResultReader(options).getSnapshot().data).toEqual({
      value: 1,
    })
    const withoutPlaceholder = observer.createResultReader({
      ...options,
      placeholderData: undefined,
    })
    withoutPlaceholder.commit()
    expect(withoutPlaceholder.getSnapshot().data).toBeUndefined()
    expect(observer.createResultReader(options).getSnapshot().data).toEqual({
      value: 2,
    })
  })

  it('resolves offline and restoring states without changing the observer', () => {
    onlineManager.setOnline(false)
    const options = client.defaultQueryOptions({
      queryKey: queryKey(),
      queryFn: () => 'data',
    })
    const observer = new QueryObserver(client, options)
    const current = observer.getCurrentResult()
    const paused = observer.createResultReader({
      ...options,
      _optimisticResults: 'optimistic',
    })
    const restoring = observer.createResultReader({
      ...options,
      _optimisticResults: 'isRestoring',
    })
    expect(paused.getSnapshot()).toMatchObject({
      fetchStatus: 'paused',
      isPaused: true,
    })
    expect(restoring.getSnapshot()).toMatchObject({
      fetchStatus: 'idle',
      isPaused: false,
    })
    expect(observer.getCurrentResult()).toBe(current)
  })

  it('preserves infinite-query fields as predicted fetching becomes real', async () => {
    const key = queryKey()
    const options: DefaultedInfiniteQueryObserverOptions<
      number,
      Error,
      InfiniteData<number>,
      Array<string>,
      number
    > = {
      queryKey: key,
      queryHash: JSON.stringify(key),
      throwOnError: false,
      refetchOnReconnect: true,
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      _optimisticResults: 'optimistic' as const,
      initialPageParam: 1,
      getNextPageParam: (lastPage: number) => lastPage + 1,
    }
    const observer = new InfiniteQueryObserver(client, options)
    const reader = observer.createResultReader(options)
    const pending = reader.getSnapshot()
    const unsubscribe = observer.subscribe(vi.fn())
    expect(reader.getSnapshot()).toBe(pending)
    await vi.advanceTimersByTimeAsync(10)
    const loaded = reader.getSnapshot()
    expect(loaded.hasNextPage).toBe(true)
    const promise = loaded.fetchNextPage()
    expect(reader.getSnapshot()).toMatchObject({
      isFetchingNextPage: true,
      isRefetching: false,
    })
    await vi.advanceTimersByTimeAsync(10)
    await promise
    expect(reader.getSnapshot()).toMatchObject({
      data: { pages: [1, 2], pageParams: [1, 2] },
      isFetchingNextPage: false,
    })
    unsubscribe()
  })
})
