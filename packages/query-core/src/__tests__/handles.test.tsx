import { describe, expect, it, vi } from 'vitest'
import {
  clearOnDispose,
  createKey,
  fakeTimers,
  sleep,
  subscribe,
} from '@tanstack/query-test-utils'
import {
  QueryClient,
  QueryObserver,
  environmentManager,
  experimental_fromHandle,
  experimental_queryHandle,
  experimental_queryHandleAsync,
  experimental_waterfallHandle,
  noop,
} from '..'

const isServer = environmentManager.isServer()

const serverEnvironment = (): Disposable => {
  environmentManager.setIsServer(() => true)
  return {
    [Symbol.dispose]: () => {
      environmentManager.setIsServer(() => isServer)
    },
  }
}

const unhandledRejections = () => {
  const listener = vi.fn<NodeJS.UnhandledRejectionListener>()
  process.on('unhandledRejection', listener)
  return Object.assign(listener, {
    [Symbol.dispose]: () => {
      process.off('unhandledRejection', listener)
    },
  })
}

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

  describe('experimental_queryHandle', () => {
    it('should start the query and return a serializable handle', () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()

      const handle = experimental_queryHandle(queryClient, postQuery, {
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

      const handle = experimental_queryHandle(queryClient, viewerQuery)

      expect(handle).toStrictEqual({ queryKey: key, input: undefined })
    })

    it('should not throw when the query fails', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery(() => Promise.reject(new Error('no')))

      experimental_queryHandle(queryClient, postQuery, { id: '1' })
      await vi.advanceTimersByTimeAsync(0)

      expect(
        queryClient.getQueryState(postQuery({ id: '1' }).queryKey)?.status,
      ).toBe('error')
    })

    it('should not cause an unhandled rejection when the queryFn rejects at once', async () => {
      using onUnhandledRejection = unhandledRejections()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery(() => Promise.reject(new Error('no')))

      experimental_queryHandle(queryClient, postQuery, { id: '1' })
      await sleep(0)

      expect(onUnhandledRejection).not.toHaveBeenCalled()
      expect(
        queryClient.getQueryState(postQuery({ id: '1' }).queryKey)?.status,
      ).toBe('error')
    })

    it('should not cause an unhandled rejection when the queryFn throws synchronously', async () => {
      using onUnhandledRejection = unhandledRejections()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery(() => {
        throw new Error('no')
      })

      experimental_queryHandle(queryClient, postQuery, { id: '1' })
      await sleep(0)

      expect(onUnhandledRejection).not.toHaveBeenCalled()
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

      experimental_queryHandle(queryClient, postQuery, { id: '1' })

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

      experimental_queryHandle(queryClient, feedQuery, { size: 1 })
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

      experimental_queryHandle(queryClient, feedQuery, { size: 1 })
      await vi.advanceTimersByTimeAsync(0)

      expect(queryClient.getQueryData([...key, 1])).toStrictEqual({
        pages: [10],
        pageParams: [1],
      })
    })
  })

  describe('experimental_queryHandleAsync', () => {
    it('should wait for the data and return a plain handle', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()

      const promise = experimental_queryHandleAsync(queryClient, postQuery, {
        id: '1',
      })
      await vi.advanceTimersByTimeAsync(10)
      const handle = await promise

      expect(handle).toStrictEqual({
        queryKey: postQuery({ id: '1' }).queryKey,
        input: { id: '1' },
      })
      expect(queryClient.getQueryData(handle.queryKey)).toBe('1')
    })

    it('should wait for fresh data when the cached data is stale', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery((id) =>
        sleep(10).then(() => `${id}-new`),
      )
      queryClient.setQueryData(postQuery({ id: '1' }).queryKey, 'cached')

      const promise = experimental_queryHandleAsync(queryClient, postQuery, {
        id: '1',
      })
      await vi.advanceTimersByTimeAsync(10)
      const handle = await promise

      expect(queryClient.getQueryData(handle.queryKey)).toBe('1-new')
    })

    it('should reject when the fetch fails', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery(() => Promise.reject(new Error('no')))

      await expect(
        experimental_queryHandleAsync(queryClient, postQuery, { id: '1' }),
      ).rejects.toThrow('no')
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
      queryClient.setQueryData(key, { pages: [10], pageParams: [1] })

      await experimental_queryHandleAsync(queryClient, feedQuery, { pages: 2 })

      expect(queryClient.getQueryData(key)).toStrictEqual({
        pages: [10, 20],
        pageParams: [1, 2],
      })
    })
  })

  describe("with queryClient.query and staleTime: 'static'", () => {
    it('should use stale cached data at once and refetch it in the background', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const queryFn = vi.fn<(id: string) => Promise<string>>((id) =>
        sleep(10).then(() => `${id}-new`),
      )
      const postQuery = createPostQuery(queryFn)
      queryClient.setQueryData(postQuery({ id: '1' }).queryKey, 'cached')

      const handle = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })
      const data = await queryClient.query({
        ...experimental_fromHandle(postQuery, handle),
        staleTime: 'static',
      })

      expect(data).toBe('cached')
      expect(queryFn).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(10)
      expect(queryClient.getQueryData(handle.queryKey)).toBe('1-new')
    })

    it('should wait for the fetch the handle started when the cache has no data', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const queryFn = vi.fn<(id: string) => Promise<string>>((id) =>
        sleep(10).then(() => id),
      )
      const postQuery = createPostQuery(queryFn)

      const handle = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })
      const promise = queryClient.query({
        ...experimental_fromHandle(postQuery, handle),
        staleTime: 'static',
      })
      await vi.advanceTimersByTimeAsync(10)

      await expect(promise).resolves.toBe('1')
      expect(queryFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('on a server client', () => {
    it('should follow staleTime as a browser client does', async () => {
      using _timers = fakeTimers()
      using _server = serverEnvironment()
      using queryClient = clearOnDispose(new QueryClient())
      const queryFn = vi.fn<(id: string) => Promise<string>>((id) =>
        sleep(10).then(() => id),
      )
      const postQuery = createPostQuery(queryFn)

      experimental_queryHandle(queryClient, postQuery, { id: '1' })
      await vi.advanceTimersByTimeAsync(10)
      expect(queryFn).toHaveBeenCalledTimes(1)

      // staleTime defaults to 0, so the data is already stale
      experimental_queryHandle(queryClient, postQuery, { id: '1' })
      expect(queryFn).toHaveBeenCalledTimes(2)
      await vi.advanceTimersByTimeAsync(10)

      const fetched = experimental_queryHandleAsync(queryClient, postQuery, {
        id: '1',
      })
      expect(queryFn).toHaveBeenCalledTimes(3)
      await vi.advanceTimersByTimeAsync(10)
      await expect(fetched).resolves.toStrictEqual({
        queryKey: postQuery({ id: '1' }).queryKey,
        input: { id: '1' },
      })
    })

    it('should not refetch data that is fresh by staleTime', async () => {
      using _timers = fakeTimers()
      using _server = serverEnvironment()
      using queryClient = clearOnDispose(
        new QueryClient({
          defaultOptions: { queries: { staleTime: 60 * 1000 } },
        }),
      )
      const queryFn = vi.fn<(id: string) => Promise<string>>((id) =>
        sleep(10).then(() => id),
      )
      const postQuery = createPostQuery(queryFn)

      const first = experimental_queryHandleAsync(queryClient, postQuery, {
        id: '1',
      })
      await vi.advanceTimersByTimeAsync(10)
      await first
      experimental_queryHandle(queryClient, postQuery, { id: '1' })
      await experimental_queryHandleAsync(queryClient, postQuery, { id: '1' })

      expect(queryFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('experimental_fromHandle', () => {
    it("should rebuild the factory's options for the handle's input", () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()
      const handle = experimental_queryHandle(queryClient, postQuery, {
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
      const handle = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })
      await vi.advanceTimersByTimeAsync(10)

      const observer = new QueryObserver(queryClient, {
        ...experimental_fromHandle(postQuery, handle),
        select: (data) => String(data).length,
      })

      expect(observer.getCurrentResult().data).toBe(1)
    })

    it('should add no initialData for an awaited handle', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()
      const promise = experimental_queryHandleAsync(queryClient, postQuery, {
        id: '1',
      })
      await vi.advanceTimersByTimeAsync(10)
      const handle = await promise

      const options = experimental_fromHandle(postQuery, handle)

      expect(options).not.toHaveProperty('initialData')
      expect(options).not.toHaveProperty('initialDataUpdatedAt')
    })

    it('should leave a reader with no data after the cache is cleared', async () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const postQuery = createPostQuery()
      const promise = experimental_queryHandleAsync(queryClient, postQuery, {
        id: '1',
      })
      await vi.advanceTimersByTimeAsync(10)
      const handle = await promise
      const options = {
        ...experimental_fromHandle(postQuery, handle),
        enabled: false,
      }
      const observer = new QueryObserver(queryClient, options)
      using _subscription = subscribe(observer, noop)

      queryClient.clear()
      // The reader renders again
      observer.setOptions(options)

      expect(queryClient.getQueryData(handle.queryKey)).toBeUndefined()
      expect(observer.getCurrentResult()).toMatchObject({
        status: 'pending',
        data: undefined,
      })
    })
  })

  describe('experimental_waterfallHandle', () => {
    it('should build a handle for the input without starting the query', () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const queryFn = vi.fn<(id: string) => Promise<string>>((id) =>
        sleep(10).then(() => id),
      )
      const postQuery = createPostQuery(queryFn)

      const handle = experimental_waterfallHandle(postQuery, { id: '1' })

      expect(handle).toStrictEqual({
        queryKey: postQuery({ id: '1' }).queryKey,
        input: { id: '1' },
      })
      expect(queryFn).not.toHaveBeenCalled()
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    })

    it('should give a factory without input an undefined input', () => {
      const key = createKey()
      const viewerQuery = () => ({ queryKey: key, queryFn: () => 'viewer' })

      expect(experimental_waterfallHandle(viewerQuery)).toStrictEqual({
        queryKey: key,
        input: undefined,
      })
    })

    it('should return the same handle while the new input maps to its query', () => {
      using _timers = fakeTimers()
      using queryClient = clearOnDispose(new QueryClient())
      const key = createKey()
      const postQuery = (input: { id: string; locale?: string }) => ({
        queryKey: [...key, input.id],
        queryFn: () => input.id,
      })
      const previous = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })

      expect(
        experimental_waterfallHandle(postQuery, previous, (input) => ({
          ...input,
          locale: 'en',
        })),
      ).toBe(previous)
      expect(
        experimental_waterfallHandle(postQuery, previous, () => ({ id: '2' })),
      ).toStrictEqual({
        queryKey: [...key, '2'],
        input: { id: '2' },
      })
    })

    it("should compare keys with the factory's queryKeyHashFn", () => {
      const key = createKey()
      const postQuery = (input: { id: string }) => ({
        queryKey: [...key, input.id],
        queryFn: () => input.id,
        queryKeyHashFn: () => 'same',
      })
      const previous = experimental_waterfallHandle(postQuery, { id: '1' })

      expect(
        experimental_waterfallHandle(postQuery, previous, () => ({ id: '2' })),
      ).toBe(previous)
    })
  })
})
