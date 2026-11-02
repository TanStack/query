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
  dehydrate,
  environmentManager,
  experimental_fromHandle,
  experimental_getQueryStartInfo,
  experimental_prefetchHandle,
  experimental_waterfallHandle,
  hydrate,
  isServer,
  noop,
} from '..'
import type { DehydratedState } from '..'

const serverEnvironment = (): Disposable => {
  environmentManager.setIsServer(() => true)
  return {
    [Symbol.dispose]: () => {
      environmentManager.setIsServer(() => isServer)
    },
  }
}

const getQuery = (
  queryClient: QueryClient,
  queryKey: ReadonlyArray<unknown>,
) => {
  const query = queryClient.getQueryCache().find({ queryKey, exact: true })
  if (!query) {
    throw new Error('no query')
  }
  return query
}

const createPostQuery = () => {
  const key = createKey()
  return (input: { id: string }) => ({
    queryKey: [...key, input.id],
    queryFn: () => sleep(10).then(() => input.id),
  })
}

describe('query start info', () => {
  it('should record how a query was started and when an observer reads it', () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const postQuery = createPostQuery()
    const handle = experimental_prefetchHandle(queryClient, postQuery, {
      id: '1',
    })
    const query = getQuery(queryClient, handle.queryKey)

    expect(experimental_getQueryStartInfo(query)).toStrictEqual({
      verb: 'prefetchHandle',
      environment: 'client',
      startedAt: Date.now(),
      observed: false,
    })

    using _subscription = subscribe(
      new QueryObserver(
        queryClient,
        experimental_fromHandle(postQuery, handle),
      ),
      noop,
    )

    expect(experimental_getQueryStartInfo(query)?.observed).toBe(true)
  })

  it('should record the first fetch of a reader of an experimental_waterfallHandle handle', async () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const postQuery = createPostQuery()
    const handle = experimental_waterfallHandle(postQuery, { id: '1' })

    expect(handle).toStrictEqual({
      queryKey: postQuery({ id: '1' }).queryKey,
      input: { id: '1' },
    })
    expect(JSON.parse(JSON.stringify(handle))).toStrictEqual(handle)

    const startedAt = Date.now()
    const observer = new QueryObserver(
      queryClient,
      experimental_fromHandle(postQuery, handle),
    )
    using _subscription = subscribe(observer, noop)
    const query = getQuery(queryClient, handle.queryKey)

    expect(experimental_getQueryStartInfo(query)).toStrictEqual({
      verb: 'waterfallHandle',
      environment: 'client',
      startedAt,
      observed: true,
    })

    await vi.advanceTimersByTimeAsync(20)
    void observer.refetch()

    expect(experimental_getQueryStartInfo(query)?.startedAt).toBe(startedAt)
  })

  it('should keep the record of a loader handle that experimental_waterfallHandle switches back to', () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const postQuery = createPostQuery()
    const handle = experimental_prefetchHandle(queryClient, postQuery, {
      id: '1',
    })
    const switched = experimental_waterfallHandle(postQuery, handle, () => ({
      id: '1',
    }))

    using _subscription = subscribe(
      new QueryObserver(
        queryClient,
        experimental_fromHandle(postQuery, switched),
      ),
      noop,
    )

    expect(
      experimental_getQueryStartInfo(getQuery(queryClient, handle.queryKey))
        ?.verb,
    ).toBe('prefetchHandle')
  })

  it('should not record queries started by other APIs', async () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const postQuery = createPostQuery()

    void queryClient.query(postQuery({ id: '1' })).catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    expect(
      experimental_getQueryStartInfo(
        getQuery(queryClient, postQuery({ id: '1' }).queryKey),
      ),
    ).toBeUndefined()
    expect(dehydrate(queryClient).queries[0]).not.toHaveProperty(
      'experimental_start',
    )
  })

  it('should carry the start info from the server to the client in development', () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const postQuery = createPostQuery()
    let dehydrated: DehydratedState
    {
      using _server = serverEnvironment()
      using serverClient = clearOnDispose(new QueryClient())
      experimental_prefetchHandle(serverClient, postQuery, { id: '1' })
      dehydrated = dehydrate(serverClient, {
        shouldDehydrateQuery: () => true,
      })
    }

    hydrate(queryClient, dehydrated)

    expect(
      experimental_getQueryStartInfo(
        getQuery(queryClient, postQuery({ id: '1' }).queryKey),
      ),
    ).toStrictEqual({
      verb: 'prefetchHandle',
      environment: 'server',
      startedAt: Date.now(),
      observed: false,
    })
  })

  it('should warn when a server render leaves out a pending query a handle started', () => {
    using _timers = fakeTimers()
    using _server = serverEnvironment()
    using serverClient = clearOnDispose(new QueryClient())
    using warn = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    experimental_prefetchHandle(serverClient, createPostQuery(), { id: '1' })

    dehydrate(serverClient)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain('experimental_prefetchHandle')
  })

  it('should not warn about pending queries started by other APIs or in the browser', () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    using warn = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    const postQuery = createPostQuery()
    experimental_prefetchHandle(queryClient, postQuery, { id: '1' })
    using _server = serverEnvironment()
    using serverClient = clearOnDispose(new QueryClient())
    void serverClient.query(postQuery({ id: '2' })).catch(noop)

    dehydrate(queryClient)
    dehydrate(serverClient)

    expect(warn).not.toHaveBeenCalled()
  })
})
