import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createKey, sleep } from '@tanstack/query-test-utils'
import {
  CancelledError,
  InfiniteQueryObserver,
  QueryCache,
  QueryClient,
  QueryObserver,
  noop,
} from '..'
import { mockOnlineManagerIsOnline } from './utils'
import type { QueryFunctionContext } from '..'

describe('refresh during an initial fetch', () => {
  let client: QueryClient
  let cache: QueryCache
  let key: ReturnType<typeof createKey>
  let queryFn: ReturnType<
    typeof vi.fn<(context: QueryFunctionContext) => Promise<string>>
  >
  let observer: QueryObserver<string>

  beforeEach(() => {
    vi.useFakeTimers()
    cache = new QueryCache()
    client = new QueryClient({ queryCache: cache })
    client.mount()
    key = createKey()
    queryFn = vi.fn<(context: QueryFunctionContext) => Promise<string>>(
      async () => {
        const data = `data${queryFn.mock.calls.length}`
        await sleep(10)
        return data
      },
    )
    observer = new QueryObserver(client, {
      queryKey: key,
      queryFn,
      staleTime: Infinity,
      retry: false,
    })
  })

  afterEach(() => {
    client.clear()
    client.unmount()
    vi.useRealTimers()
  })

  it('reuses a plain initial refetch', async () => {
    const unsubscribe = observer.subscribe(noop)
    const refetch = observer.refetch()
    await vi.advanceTimersByTimeAsync(10)
    await expect(refetch).resolves.toMatchObject({ data: 'data1' })
    expect(queryFn).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it.each(['false', 'none'] as const)(
    'does not queue with %s',
    async (mode) => {
      const unsubscribe = observer.subscribe(noop)
      const invalidation =
        mode === 'false'
          ? client.invalidateQueries(
              { queryKey: key },
              { cancelRefetch: false },
            )
          : client.invalidateQueries({ queryKey: key, refetchType: 'none' })
      await vi.advanceTimersByTimeAsync(20)
      await invalidation
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(observer.getCurrentResult().isStale).toBe(false)
      unsubscribe()
    },
  )

  it('queues an explicit refetch after a no-refetch invalidation', async () => {
    const unsubscribe = observer.subscribe(noop)
    await client.invalidateQueries({ queryKey: key, refetchType: 'none' })
    const refetch = observer.refetch()
    await vi.advanceTimersByTimeAsync(10)
    expect(client.getQueryData(key)).toBe('data1')
    expect(queryFn).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(10)
    await expect(refetch).resolves.toMatchObject({ data: 'data2' })
    unsubscribe()
  })

  it('coalesces invalidations and follows a later background replacement', async () => {
    const unsubscribe = observer.subscribe(noop)
    const completed = vi.fn<() => void>()
    const first = client.invalidateQueries({ queryKey: key }).then(completed)
    const second = client.invalidateQueries({ queryKey: key }).then(completed)
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(completed).not.toHaveBeenCalled()
    const third = client.invalidateQueries({ queryKey: key }).then(completed)
    expect(queryFn).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(10)
    await Promise.all([first, second, third])
    expect(completed).toHaveBeenCalledTimes(3)
    expect(client.getQueryData(key)).toBe('data3')
    unsubscribe()
  })

  it('publishes the old result as invalidated in one success update', async () => {
    const unsubscribe = observer.subscribe(noop)
    const states: Array<{ data: unknown; invalidated: boolean }> = []
    cache.subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'success') {
        states.push({
          data: event.query.state.data,
          invalidated: event.query.state.isInvalidated,
        })
      }
    })
    const invalidation = client.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(20)
    await invalidation
    expect(states).toStrictEqual([
      { data: 'data1', invalidated: true },
      { data: 'data2', invalidated: false },
    ])
    expect(observer.getCurrentQuery().promise).toBeUndefined()
    expect(Object.keys(observer.getCurrentQuery().state)).toStrictEqual(
      Object.keys(observer.getCurrentQuery().resetState),
    )
    unsubscribe()
  })

  it.each([false, true])(
    'withdraws on final unsubscribe, signal consumed %s',
    async (consumeSignal) => {
      queryFn.mockImplementation(async (context) => {
        if (consumeSignal) {
          void context.signal
        }
        await sleep(10)
        return 'data1'
      })
      const unsubscribe = observer.subscribe(noop)
      const invalidation = client.invalidateQueries({ queryKey: key })
      unsubscribe()
      await vi.advanceTimersByTimeAsync(20)
      await invalidation
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(client.getQueryData(key)).toBe(consumeSignal ? undefined : 'data1')
    },
  )

  it.each([
    [
      'cancel',
      () => client.cancelQueries({ queryKey: key }),
      new CancelledError({ revert: true }),
      1,
    ],
    [
      'remove',
      () => client.removeQueries({ queryKey: key }),
      new CancelledError({ silent: true }),
      1,
    ],
    ['reset', () => client.resetQueries({ queryKey: key }), 'data2', 2],
  ] as const)(
    'withdraws on %s',
    async (_operation, stop, expected, fetchCount) => {
      const unsubscribe = observer.subscribe(noop)
      const invalidation = observer
        .getCurrentQuery()
        .fetch(undefined, { cancelRefetch: false })
      invalidation.catch(noop)
      observer.getCurrentQuery().invalidate()
      const refresh = observer
        .getCurrentQuery()
        .fetch(undefined, { cancelRefetch: true })
      const outcome = refresh.catch((error: unknown) => error)
      const stopped = stop()
      await vi.advanceTimersByTimeAsync(20)
      await stopped
      await expect(outcome).resolves.toStrictEqual(expected)
      expect(queryFn).toHaveBeenCalledTimes(fetchCount)
      unsubscribe()
    },
  )

  it('keeps queued work after a manual write and adopts a full replacement', async () => {
    const unsubscribe = observer.subscribe(noop)
    const invalidation = client.invalidateQueries({ queryKey: key })
    client.setQueryData(key, 'manual')
    const replacement = observer.refetch()
    expect(queryFn).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(20)
    await Promise.all([invalidation, replacement])
    expect(client.getQueryData(key)).toBe('data2')
    expect(queryFn).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('keeps queued work after a manual write without replacement', async () => {
    const unsubscribe = observer.subscribe(noop)
    const invalidation = client.invalidateQueries({ queryKey: key })
    client.setQueryData(key, 'manual')
    await vi.advanceTimersByTimeAsync(20)
    await invalidation
    expect(client.getQueryData(key)).toBe('data2')
    expect(queryFn).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it.each(['directional', 'external'] as const)(
    'transfers demand through a %s replacement',
    async (operation) => {
      const unsubscribe = observer.subscribe(noop)
      const invalidation = client.invalidateQueries({ queryKey: key })
      const completed = vi.fn<() => void>()
      invalidation.then(completed)
      client.setQueryData(key, 'manual')
      const replacement = observer.getCurrentQuery().fetch(undefined, {
        cancelRefetch: true,
        ...(operation === 'directional'
          ? { meta: { fetchMore: { direction: 'forward' as const } } }
          : { initialPromise: sleep(10).then(() => 'external') }),
      })
      await vi.advanceTimersByTimeAsync(10)
      await replacement
      expect(completed).not.toHaveBeenCalled()
      expect(queryFn).toHaveBeenCalledTimes(operation === 'directional' ? 3 : 2)
      expect(client.getQueryState(key)?.isInvalidated).toBe(true)
      await vi.advanceTimersByTimeAsync(10)
      await invalidation
      expect(client.getQueryData(key)).toBe(
        operation === 'directional' ? 'data3' : 'data2',
      )
      unsubscribe()
    },
  )

  it('fully revalidates all pages after a directional replacement', async () => {
    const pageFn = vi.fn<
      (
        context: QueryFunctionContext<ReturnType<typeof createKey>, number>,
      ) => Promise<string>
    >(async ({ pageParam }): Promise<string> => {
      const result = `${pageParam}:${pageFn.mock.calls.length}`
      await sleep(10)
      return result
    })
    const infinite = new InfiniteQueryObserver(client, {
      queryKey: key,
      queryFn: pageFn,
      initialPageParam: 0,
      getNextPageParam: (_last, _pages, lastParam) => lastParam + 1,
      staleTime: Infinity,
    })
    const unsubscribe = infinite.subscribe(noop)
    const invalidation = client.invalidateQueries({ queryKey: key })
    client.setQueryData(key, { pages: ['manual'], pageParams: [0] })
    const page = infinite.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    await page
    expect(client.getQueryData(key)).toStrictEqual({
      pages: ['manual', '1:2'],
      pageParams: [0, 1],
    })
    await vi.advanceTimersByTimeAsync(20)
    await invalidation
    expect(
      pageFn.mock.calls.map(([context]) => context.pageParam),
    ).toStrictEqual([0, 1, 0, 1])
    expect(client.getQueryData(key)).toStrictEqual({
      pages: ['0:3', '1:4'],
      pageParams: [0, 1],
    })
    unsubscribe()
  })

  it.each(['onSuccess', 'onSettled'] as const)(
    'adopts a new full run from the cache %s callback',
    async (callback) => {
      const unsubscribe = observer.subscribe(noop)
      const replacement = vi.fn<() => void>(() => {
        if (queryFn.mock.calls.length === 1) {
          void observer.refetch()
        }
      })
      cache.config[callback] = replacement
      const invalidation = client.invalidateQueries({ queryKey: key })
      await vi.advanceTimersByTimeAsync(20)
      await invalidation
      expect(queryFn).toHaveBeenCalledTimes(2)
      expect(client.getQueryData(key)).toBe('data2')
      unsubscribe()
    },
  )

  it.each(['onSuccess', 'onSettled'] as const)(
    'withdraws if a cache %s callback removes the query',
    async (callback) => {
      const unsubscribe = observer.subscribe(noop)
      const remove = () => client.removeQueries({ queryKey: key })
      cache.config[callback] = remove
      const invalidation = client.invalidateQueries({ queryKey: key })
      await vi.advanceTimersByTimeAsync(20)
      await invalidation
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(client.getQueryData(key)).toBeUndefined()
      unsubscribe()
    },
  )

  it.each([false, true])(
    'can cancel from the start notification, online %s',
    async (online) => {
      mockOnlineManagerIsOnline(online)
      cache.subscribe((event) => {
        if (event.type === 'updated' && event.action.type === 'fetch') {
          void client.cancelQueries({ queryKey: key })
        }
      })
      const unsubscribe = observer.subscribe(noop)
      await vi.advanceTimersByTimeAsync(20)
      expect(queryFn).not.toHaveBeenCalled()
      expect(client.getQueryState(key)?.fetchStatus).toBe('idle')
      unsubscribe()
    },
  )

  it('can cancel a paused successor from its start notification', async () => {
    const online = mockOnlineManagerIsOnline(true)
    cache.config.onSuccess = () => online.mockReturnValue(false)
    cache.subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.action.type === 'fetch' &&
        event.query.state.data === 'data1'
      ) {
        void client.cancelQueries({ queryKey: key })
      }
    })
    const unsubscribe = observer.subscribe(noop)
    const invalidation = client.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(20)
    await invalidation
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(client.getQueryState(key)).toMatchObject({
      data: 'data1',
      fetchStatus: 'idle',
    })
    unsubscribe()
  })

  it('withdraws a successor removed by its behavior hook', async () => {
    const unsubscribe = observer.subscribe(noop)
    const invalidation = client.invalidateQueries({ queryKey: key })
    observer.getCurrentQuery().setOptions({
      ...observer.options,
      behavior: { onFetch: () => client.removeQueries({ queryKey: key }) },
    })
    await vi.advanceTimersByTimeAsync(20)
    await invalidation
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(client.getQueryData(key)).toBeUndefined()
    unsubscribe()
  })

  it('rejects the queued demand if its behavior hook throws before reservation', async () => {
    const unsubscribe = observer.subscribe(noop)
    const invalidation = client
      .invalidateQueries({ queryKey: key }, { throwOnError: true })
      .catch((error: unknown) => error)
    observer.getCurrentQuery().setOptions({
      ...observer.options,
      behavior: {
        onFetch: () => {
          throw new Error('behavior')
        },
      },
    })
    await vi.advanceTimersByTimeAsync(20)
    await expect(invalidation).resolves.toStrictEqual(new Error('behavior'))
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(client.getQueryData(key)).toBe('data1')
    expect(observer.getCurrentQuery().promise).toBeUndefined()
    unsubscribe()
  })

  it('can request a refresh from the start notification', async () => {
    let refresh: Promise<void> | undefined
    cache.subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.action.type === 'fetch' &&
        queryFn.mock.calls.length === 0
      ) {
        refresh = client.invalidateQueries({ queryKey: key })
      }
    })
    const unsubscribe = observer.subscribe(noop)
    await vi.advanceTimersByTimeAsync(20)
    await refresh
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(client.getQueryData(key)).toBe('data2')
    unsubscribe()
  })

  it('can cancel inside a synchronous query function', async () => {
    queryFn.mockImplementation(() => {
      void client.cancelQueries({ queryKey: key })
      return Promise.resolve('cancelled')
    })
    const unsubscribe = observer.subscribe(noop)
    await vi.advanceTimersByTimeAsync(20)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(client.getQueryState(key)).toMatchObject({
      data: undefined,
      fetchStatus: 'idle',
    })
    unsubscribe()
  })

  it('does not queue a page fetch during an invalidated initial fetch', async () => {
    const unsubscribe = observer.subscribe(noop)
    observer.getCurrentQuery().invalidate()
    const page = observer.getCurrentQuery().fetch(undefined, {
      cancelRefetch: true,
      meta: { fetchMore: { direction: 'forward' } },
    })
    await vi.advanceTimersByTimeAsync(20)
    await expect(page).resolves.toBe('data1')
    expect(queryFn).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('keeps withdrawn invalidation available to a later explicit refetch', async () => {
    const unsubscribe = observer.subscribe(noop)
    const withdrawn = client.invalidateQueries({ queryKey: key })
    unsubscribe()
    const resubscribe = observer.subscribe(noop)
    const selected = observer.refetch()
    await vi.advanceTimersByTimeAsync(20)
    await withdrawn
    await expect(selected).resolves.toMatchObject({ data: 'data2' })
    expect(queryFn).toHaveBeenCalledTimes(2)
    resubscribe()
  })

  it('withdraws if the first success notification unsubscribes the last observer', async () => {
    const unsubscribe = observer.subscribe((result) => {
      if (result.data === 'data1') {
        unsubscribe()
      }
    })
    const invalidation = client.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(20)
    await invalidation
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(client.getQueryData(key)).toBe('data1')
  })

  it('cannot resurrect a replacement removed by a later cache callback', async () => {
    const unsubscribe = observer.subscribe(noop)
    cache.config.onSuccess = () => {
      void observer.refetch()
    }
    cache.config.onSettled = () => client.removeQueries({ queryKey: key })
    const invalidation = client.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(30)
    await invalidation
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(client.getQueryData(key)).toBeUndefined()
    unsubscribe()
  })

  it('can invalidate and request a refresh inside the first query function call', async () => {
    let refresh: Promise<void> | undefined
    queryFn.mockImplementation(async () => {
      const data = `data${queryFn.mock.calls.length}`
      if (queryFn.mock.calls.length === 1) {
        refresh = client.invalidateQueries({ queryKey: key })
      }
      await sleep(10)
      return data
    })
    const unsubscribe = observer.subscribe(noop)
    await vi.advanceTimersByTimeAsync(20)
    await refresh
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(client.getQueryData(key)).toBe('data2')
    unsubscribe()
  })

  it('uses current options and keeps request-time selection', async () => {
    const unsubscribe = observer.subscribe(noop)
    const invalidation = client.invalidateQueries({ queryKey: key })
    observer.setOptions({
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return 'updated'
      },
      enabled: false,
      staleTime: 'static',
    })
    await vi.advanceTimersByTimeAsync(20)
    await invalidation
    expect(client.getQueryData(key)).toBe('updated')
    expect(queryFn).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('allows an explicit observer refresh for a disabled static query', async () => {
    observer.setOptions({
      ...observer.options,
      enabled: false,
      staleTime: 'static',
    })
    const unsubscribe = observer.subscribe(noop)
    const initial = observer.refetch()
    await client.invalidateQueries({ queryKey: key })
    const refresh = observer.refetch()
    await vi.advanceTimersByTimeAsync(20)
    await expect(initial).resolves.toMatchObject({ data: 'data1' })
    await expect(refresh).resolves.toMatchObject({ data: 'data2' })
    expect(queryFn).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it.each(['all', 'inactive'] as const)(
    'allows an explicitly selected %s query without observers',
    async (refetchType) => {
      queryFn.mockRejectedValueOnce(new Error('first attempt'))
      await observer.refetch()
      const initial = client.query({ queryKey: key, queryFn, retry: false })
      const invalidation = client.invalidateQueries({
        queryKey: key,
        refetchType,
      })
      await vi.advanceTimersByTimeAsync(20)
      await initial
      await invalidation
      expect(queryFn).toHaveBeenCalledTimes(3)
      expect(client.getQueryData(key)).toBe('data3')
    },
  )

  it('runs the refresh after the source exhausts its retries', async () => {
    queryFn
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('retry'))
    observer.setOptions({ ...observer.options, retry: 1, retryDelay: 1 })
    const unsubscribe = observer.subscribe(noop)
    const initial = observer
      .refetch({ throwOnError: true })
      .catch((error: unknown) => error)
    const invalidation = client.invalidateQueries(
      { queryKey: key },
      { throwOnError: true },
    )
    await vi.advanceTimersByTimeAsync(20)
    await expect(initial).resolves.toStrictEqual(new Error('retry'))
    await invalidation
    expect(queryFn).toHaveBeenCalledTimes(3)
    expect(client.getQueryData(key)).toBe('data3')
    unsubscribe()
  })

  it('adopts a full run started by the cache error callback', async () => {
    queryFn.mockRejectedValueOnce(new Error('source'))
    cache.config.onError = () => {
      void observer.refetch()
    }
    const unsubscribe = observer.subscribe(noop)
    const invalidation = client.invalidateQueries(
      { queryKey: key },
      { throwOnError: true },
    )
    await vi.advanceTimersByTimeAsync(20)
    await invalidation
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(client.getQueryData(key)).toBe('data2')
    unsubscribe()
  })

  it('does not recheck public invalidation state when a newer run is invalidated', async () => {
    queryFn.mockRejectedValueOnce(new Error('source'))
    cache.config.onError = () => {
      void observer.refetch()
      void client.invalidateQueries({ queryKey: key })
    }
    const unsubscribe = observer.subscribe(noop)
    await vi.advanceTimersByTimeAsync(30)
    expect(queryFn).toHaveBeenCalledTimes(3)
    expect(client.getQueryData(key)).toBe('data3')
    unsubscribe()
  })

  it('waits through a paused retry before the queued refresh', async () => {
    const online = mockOnlineManagerIsOnline(true)
    queryFn.mockImplementationOnce(async () => {
      await sleep(10)
      online.mockReturnValue(false)
      throw new Error('source')
    })
    observer.setOptions({ ...observer.options, retry: 1, retryDelay: 1 })
    const unsubscribe = observer.subscribe(noop)
    const completed = vi.fn<() => void>()
    const invalidation = client
      .invalidateQueries({ queryKey: key })
      .then(() => completed())
    await vi.advanceTimersByTimeAsync(20)
    expect(client.getQueryState(key)?.fetchStatus).toBe('paused')
    expect(completed).not.toHaveBeenCalled()
    online.mockReturnValue(true)
    observer.getCurrentQuery().onOnline()
    await vi.advanceTimersByTimeAsync(20)
    await invalidation
    expect(queryFn).toHaveBeenCalledTimes(3)
    expect(client.getQueryData(key)).toBe('data3')
    unsubscribe()
  })

  it('waits if the queued successor pauses before it can start', async () => {
    const online = mockOnlineManagerIsOnline(true)
    cache.config.onSuccess = noop
    vi.spyOn(cache.config, 'onSuccess').mockImplementationOnce(() => {
      online.mockReturnValue(false)
    })
    const unsubscribe = observer.subscribe(noop)
    const completed = vi.fn<() => void>()
    const invalidation = client
      .invalidateQueries({ queryKey: key })
      .then(() => completed())
    await vi.advanceTimersByTimeAsync(20)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(client.getQueryState(key)?.fetchStatus).toBe('paused')
    expect(completed).not.toHaveBeenCalled()
    online.mockReturnValue(true)
    observer.getCurrentQuery().onOnline()
    await vi.advanceTimersByTimeAsync(10)
    await invalidation
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(client.getQueryData(key)).toBe('data2')
    unsubscribe()
  })

  it('keeps each invalidation caller error policy', async () => {
    queryFn
      .mockImplementationOnce(async () => {
        await sleep(10)
        return 'data1'
      })
      .mockRejectedValue(new Error('refresh'))
    const unsubscribe = observer.subscribe(noop)
    const quiet = client.invalidateQueries({ queryKey: key })
    const loud = client
      .invalidateQueries({ queryKey: key }, { throwOnError: true })
      .catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(20)
    await expect(quiet).resolves.toBeUndefined()
    await expect(loud).resolves.toStrictEqual(new Error('refresh'))
    expect(queryFn).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('returns immediately for an initially paused invalidation and handles its later error', async () => {
    const online = mockOnlineManagerIsOnline(false)
    const unsubscribe = observer.subscribe(noop)
    const completed = vi.fn<() => void>()
    await client
      .invalidateQueries({ queryKey: key }, { throwOnError: true })
      .then(completed)
    expect(completed).toHaveBeenCalledTimes(1)
    expect(queryFn).not.toHaveBeenCalled()
    queryFn.mockRejectedValue(new Error('offline refresh'))
    online.mockReturnValue(true)
    observer.getCurrentQuery().onOnline()
    await vi.advanceTimersByTimeAsync(20)
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(observer.getCurrentResult().error).toStrictEqual(
      new Error('offline refresh'),
    )
    unsubscribe()
  })
})
