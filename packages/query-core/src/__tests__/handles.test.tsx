import { describe, expect, it, vi } from 'vitest'
import {
  clearOnDispose,
  createKey,
  fakeTimers,
  sleep,
} from '@tanstack/query-test-utils'
import {
  QueryClient,
  QueryObserver,
  experimental_ensureHandle,
  experimental_fetchHandle,
  experimental_fromHandle,
  experimental_prefetchHandle,
  experimental_waterfallHandle,
} from '..'

describe('query handles', () => {
  const createPostQuery = (
    queryFn = (id: string) => sleep(10).then(() => id),
  ) => {
    const key = createKey()
    return (input: { id: string }) => ({
      queryKey: [...key, input.id],
      queryFn: () => queryFn(input.id),
    })
  }

  describe('experimental_prefetchHandle', () => {
    it('should start the query and return a serializable handle', () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()

      const handle = experimental_prefetchHandle(queryClient, postQuery, {
        id: '1',
      })

      expect(handle).toStrictEqual({
        queryKey: postQuery({ id: '1' }).queryKey,
        input: { id: '1' },
      })
      expect(JSON.parse(JSON.stringify(handle))).toStrictEqual(handle)
      expect(
        queryClient.getQueryState(postQuery({ id: '1' }).queryKey)?.fetchStatus,
      ).toBe('fetching')
    })

    it('should give a factory without input an undefined input', () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const key = createKey()
      const viewerQuery = () => ({
        queryKey: key,
        queryFn: () => 'viewer',
      })

      const handle = experimental_prefetchHandle(queryClient, viewerQuery)

      expect(handle).toStrictEqual({ queryKey: key, input: undefined })
    })

    it('should not throw when the query fails', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery(() => Promise.reject(new Error('no')))

      experimental_prefetchHandle(queryClient, postQuery, { id: '1' })
      await vi.advanceTimersByTimeAsync(0)

      expect(
        queryClient.getQueryState(postQuery({ id: '1' }).queryKey)?.status,
      ).toBe('error')
    })

    it('should not refetch fresh data', () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const key = createKey()
      const queryFn = vi.fn<() => Promise<string>>(() => Promise.resolve('new'))
      const postQuery = (input: { id: string }) => ({
        queryKey: [...key, input.id],
        queryFn,
        staleTime: Infinity,
      })
      queryClient.setQueryData(postQuery({ id: '1' }).queryKey, 'cached')

      experimental_prefetchHandle(queryClient, postQuery, { id: '1' })

      expect(queryFn).not.toHaveBeenCalled()
    })

    it('should start an infinite query for infinite options', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const key = createKey()
      const feedQuery = (input: { size: number }) => ({
        queryKey: [...key, input.size],
        queryFn: ({ pageParam }: { pageParam: number }) => pageParam * 10,
        initialPageParam: 1,
        getNextPageParam: (lastPage: number) => lastPage + 1,
      })

      experimental_prefetchHandle(queryClient, feedQuery, { size: 1 })
      await vi.advanceTimersByTimeAsync(0)

      expect(queryClient.getQueryData([...key, 1])).toStrictEqual({
        pages: [10],
        pageParams: [1],
      })
    })

    it('should start an infinite query for infinite options without getNextPageParam', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const key = createKey()
      const feedQuery = (input: { size: number }) => ({
        queryKey: [...key, input.size],
        queryFn: ({ pageParam }: { pageParam: number }) => pageParam * 10,
        initialPageParam: 1,
      })

      experimental_prefetchHandle(queryClient, feedQuery, { size: 1 })
      await vi.advanceTimersByTimeAsync(0)

      expect(queryClient.getQueryData([...key, 1])).toStrictEqual({
        pages: [10],
        pageParams: [1],
      })
    })
  })

  describe('experimental_ensureHandle', () => {
    it('should wait for the data and carry it', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()

      const promise = experimental_ensureHandle(queryClient, postQuery, {
        id: '1',
      })
      await vi.advanceTimersByTimeAsync(10)
      const handle = await promise

      expect(handle).toStrictEqual({
        queryKey: postQuery({ id: '1' }).queryKey,
        input: { id: '1' },
        data: '1',
        dataUpdatedAt: Date.now(),
      })
    })

    it('should load the pages an infinite factory asks for', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const key = createKey()
      const feedQuery = (input: { pages: number }) => ({
        queryKey: key,
        queryFn: ({ pageParam }: { pageParam: number }) => pageParam * 10,
        initialPageParam: 1,
        getNextPageParam: (lastPage: number) => lastPage / 10 + 1,
        pages: input.pages,
      })

      const handle = await experimental_ensureHandle(queryClient, feedQuery, {
        pages: 3,
      })

      expect(handle.data).toStrictEqual({
        pages: [10, 20, 30],
        pageParams: [1, 2, 3],
      })
    })

    it('should resolve with stale cached data at once and refetch it in the background', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const queryFn = vi.fn<(id: string) => Promise<string>>((id) =>
        sleep(10).then(() => `${id}-new`),
      )
      const postQuery = createPostQuery(queryFn)
      queryClient.setQueryData(postQuery({ id: '1' }).queryKey, 'cached')

      const handle = await experimental_ensureHandle(queryClient, postQuery, {
        id: '1',
      })

      expect(handle.data).toBe('cached')
      expect(queryFn).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(10)
      expect(queryClient.getQueryData(postQuery({ id: '1' }).queryKey)).toBe(
        '1-new',
      )
    })

    it('should not reject when a background refetch of cached data fails', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery(() => Promise.reject(new Error('no')))
      queryClient.setQueryData(postQuery({ id: '1' }).queryKey, 'cached')

      const handle = await experimental_ensureHandle(queryClient, postQuery, {
        id: '1',
      })
      await vi.advanceTimersByTimeAsync(0)

      expect(handle.data).toBe('cached')
    })

    it('should reject when the query has no data and fails', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery(() => Promise.reject(new Error('no')))

      await expect(
        experimental_ensureHandle(queryClient, postQuery, { id: '1' }),
      ).rejects.toThrow('no')
    })
  })

  describe('experimental_fetchHandle', () => {
    it('should wait for fresh data when the cached data is stale', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery((id) =>
        sleep(10).then(() => `${id}-new`),
      )
      queryClient.setQueryData(postQuery({ id: '1' }).queryKey, 'cached')

      const promise = experimental_fetchHandle(queryClient, postQuery, {
        id: '1',
      })
      await vi.advanceTimersByTimeAsync(10)

      await expect(promise).resolves.toMatchObject({ data: '1-new' })
    })

    it('should reject when the fetch fails', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery(() => Promise.reject(new Error('no')))

      await expect(
        experimental_fetchHandle(queryClient, postQuery, { id: '1' }),
      ).rejects.toThrow('no')
    })
  })

  describe('experimental_fromHandle', () => {
    it("should rebuild the factory's options for the handle's input", () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()
      const handle = experimental_prefetchHandle(queryClient, postQuery, {
        id: '1',
      })

      const options = experimental_fromHandle(postQuery, handle)

      expect(options).toStrictEqual({
        ...postQuery({ id: '1' }),
        queryFn: expect.any(Function),
      })
      expect(options).not.toHaveProperty('initialData')
    })

    it('should take read-site options spread over it', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()
      const handle = experimental_prefetchHandle(queryClient, postQuery, {
        id: '1',
      })
      await vi.advanceTimersByTimeAsync(10)

      const observer = new QueryObserver(queryClient, {
        ...experimental_fromHandle(postQuery, handle),
        select: (data) => String(data).length,
      })

      expect(observer.getCurrentResult().data).toBe(1)
    })

    it("should pass an awaited handle's data on as initialData", async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()
      const promise = experimental_fetchHandle(queryClient, postQuery, {
        id: '1',
      })
      await vi.advanceTimersByTimeAsync(10)
      const handle = await promise

      const options = experimental_fromHandle(postQuery, handle)

      expect(options.initialData).toBe('1')
      expect(options.initialDataUpdatedAt).toBe(handle.dataUpdatedAt)
    })

    it("should give a new client the handle's data", () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()
      const handle = {
        queryKey: postQuery({ id: '1' }).queryKey,
        input: { id: '1' },
        data: 'from the loader',
        dataUpdatedAt: Date.now(),
      }

      const observer = new QueryObserver(queryClient, {
        ...experimental_fromHandle(postQuery, handle),
        enabled: false,
      })

      expect(observer.getCurrentResult()).toMatchObject({
        status: 'success',
        data: 'from the loader',
      })
    })

    it('should let data already in the cache win over the handle data', () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()
      const handle = {
        queryKey: postQuery({ id: '1' }).queryKey,
        input: { id: '1' },
        data: 'from the loader',
        dataUpdatedAt: Date.now() - 1000,
      }
      queryClient.setQueryData(handle.queryKey, 'newer')

      const observer = new QueryObserver(
        queryClient,
        experimental_fromHandle(postQuery, handle),
      )

      expect(observer.getCurrentResult().data).toBe('newer')
    })
  })

  describe('experimental_waterfallHandle', () => {
    it('should start a query the cache has never fetched, once', () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const queryFn = vi.fn<(id: string) => Promise<string>>((id) =>
        sleep(10).then(() => id),
      )
      const postQuery = createPostQuery(queryFn)

      experimental_waterfallHandle(queryClient, postQuery, { id: '1' })
      experimental_waterfallHandle(queryClient, postQuery, { id: '1' })

      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should leave stale and errored entries to the reader', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const queryFn = vi.fn<(id: string) => Promise<string>>((id) =>
        Promise.resolve(id),
      )
      const postQuery = createPostQuery(queryFn)
      queryClient.setQueryData(postQuery({ id: '1' }).queryKey, 'stale')
      const failing = createPostQuery(() => Promise.reject(new Error('no')))
      await queryClient.query(failing({ id: '1' })).catch(() => undefined)

      experimental_waterfallHandle(queryClient, postQuery, { id: '1' })
      experimental_waterfallHandle(queryClient, failing, { id: '1' })

      expect(queryFn).not.toHaveBeenCalled()
      expect(
        queryClient.getQueryState(failing({ id: '1' }).queryKey)?.fetchStatus,
      ).toBe('idle')
    })

    it('should return the previous handle while the switched input maps to its query', () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const key = createKey()
      const postQuery = (input: { id: string; locale?: string }) => ({
        queryKey: [...key, input.id],
        queryFn: () => input.id,
      })
      const previous = experimental_prefetchHandle(queryClient, postQuery, {
        id: '1',
      })

      expect(
        experimental_waterfallHandle(
          queryClient,
          postQuery,
          { id: '1', locale: 'en' },
          previous,
        ),
      ).toBe(previous)

      const next = experimental_waterfallHandle(
        queryClient,
        postQuery,
        { id: '2' },
        previous,
      )
      expect(next).toStrictEqual({
        queryKey: [...key, '2'],
        input: { id: '2' },
      })
    })
  })
})
