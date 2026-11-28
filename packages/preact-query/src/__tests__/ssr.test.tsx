import {
  clearQueryClient,
  findCachedQuery,
  infiniteQuery,
  query as queryQuery,
} from '@tanstack/query-core'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { renderToString } from 'preact-render-to-string'
import { useState } from 'preact/hooks'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  infiniteQueryOptions,
  noop,
  queryOptions,
  useMutationState,
  useQuery,
} from '..'
import { setIsServer } from './utils'

describe('Server Side Rendering', () => {
  let restoreIsServer: () => void
  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeAll(() => {
    restoreIsServer = setIsServer(true)
  })

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
  })

  afterEach(() => {
    clearQueryClient(queryClient)
    vi.useRealTimers()
  })

  afterAll(() => {
    restoreIsServer()
  })

  it('should not trigger fetch', () => {
    const key = createKey()
    const queryFn = vi.fn<() => Promise<string>>(() =>
      sleep(10).then(() => 'data'),
    )

    function Page() {
      const query = useQuery(queryOptions({ queryKey: key, queryFn }))

      const content = `status ${query.status}`

      return (
        <div>
          <div>{content}</div>
        </div>
      )
    }

    const markup = renderToString(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    expect(markup).toContain('status pending')
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  it('should add prefetched data to cache', async () => {
    const key = createKey()

    const promise = queryQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const data = await promise

    expect(data).toBe('data')
    expect(findCachedQuery(queryCache, { queryKey: key })?.state.data).toBe(
      'data',
    )
  })

  it('should return existing data from the cache', async () => {
    const key = createKey()
    const queryFn = vi.fn<() => Promise<string>>(() =>
      sleep(10).then(() => 'data'),
    )

    function Page() {
      const query = useQuery(queryOptions({ queryKey: key, queryFn }))

      const content = `status ${query.status}`

      return (
        <div>
          <div>{content}</div>
        </div>
      )
    }

    void queryQuery(queryClient, { queryKey: key, queryFn }).catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const markup = renderToString(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    expect(markup).toContain('status success')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should add initialData to the cache', () => {
    const key = createKey()

    function Page() {
      const [page, setPage] = useState(1)
      const { data } = useQuery(
        queryOptions({
          queryKey: [key, page],
          queryFn: () => sleep(10).then(() => page),
          initialData: 1,
        }),
      )

      return (
        <div>
          <h1 data-testid="title">{data}</h1>
          <button onClick={() => setPage(page + 1)}>next</button>
        </div>
      )
    }

    renderToString(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    const keys = queryCache.getAll().map((query) => query.queryKey)

    expect(keys).toStrictEqual([[key, 1]])
  })

  it('should return empty array from useMutationState', () => {
    function Page() {
      const mutationState = useMutationState()

      return <div>{`mutationState: ${mutationState.length}`}</div>
    }

    const markup = renderToString(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    expect(markup).toContain('mutationState: 0')
  })

  it('should return the correct state from useInfiniteQuery', async () => {
    const key = createKey()
    const queryFn = vi.fn<() => Promise<string>>(() =>
      sleep(10).then(() => 'page 1'),
    )

    function Page() {
      const query = useQuery(
        infiniteQueryOptions({
          queryKey: key,
          queryFn,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        }),
      )
      return (
        <ul>
          {query.data?.pages.map((page) => (
            <li key={page}>{page}</li>
          ))}
        </ul>
      )
    }

    void infiniteQuery(queryClient, {
      queryKey: key,
      queryFn,
      getNextPageParam: () => undefined,
      initialPageParam: 0,
    }).catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const markup = renderToString(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    expect(markup).toContain('page 1')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})
