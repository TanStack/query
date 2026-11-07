// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Suspense, createComponent } from 'solid-js'
import { renderToStringAsync } from 'solid-js/web'
import { createKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  notifyManager,
  useInfiniteQuery,
  useQuery,
} from '..'
import type { JSX } from 'solid-js'

describe('Server Side Rendering', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  function renderToString(Page: () => JSX.Element) {
    return renderToStringAsync(() =>
      createComponent(QueryClientProvider, {
        client: queryClient,
        get children() {
          return createComponent(Page, {})
        },
      }),
    )
  }

  it('should render the resolved query state', async () => {
    const key = createKey()

    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
      }))

      return createComponent(Suspense, {
        fallback: 'loading',
        get children() {
          return `data: ${query.data}, status: ${query.status}, isFetching: ${query.isFetching}`
        },
      })
    }

    const markup = renderToString(Page)
    await vi.advanceTimersByTimeAsync(11)

    await expect(markup).resolves.toContain(
      'data: data, status: success, isFetching: false',
    )
  })

  it('should render the query state the resource resolved with', async () => {
    const key = createKey()
    const otherKey = createKey()

    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        initialData: 'initial',
      }))
      const otherQuery = useQuery(() => ({
        queryKey: otherKey,
        queryFn: () => sleep(50).then(() => 'other'),
      }))

      return createComponent(Suspense, {
        fallback: 'loading',
        get children() {
          return `data: ${query.data}, isFetching: ${query.isFetching}, other: ${otherQuery.data}`
        },
      })
    }

    const markup = renderToString(Page)
    await vi.advanceTimersByTimeAsync(51)

    await expect(markup).resolves.toContain(
      'data: initial, isFetching: true, other: other',
    )
  })

  it('should render the query state the resource resolved with when updates are batched', async () => {
    const key = createKey()

    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
      }))

      return createComponent(Suspense, {
        fallback: 'loading',
        get children() {
          return `data: ${query.data}, dataUpdatedAt: ${query.dataUpdatedAt}`
        },
      })
    }

    const markup = renderToString(Page)
    await vi.advanceTimersByTimeAsync(5)
    notifyManager.batch(() => {
      queryClient.setQueryData(key, 'first', { updatedAt: 1 })
      queryClient.setQueryData(key, 'second', { updatedAt: 2 })
    })
    await vi.advanceTimersByTimeAsync(6)

    await expect(markup).resolves.toContain('data: first, dataUpdatedAt: 1')
  })

  it('should render the resolved infinite query state', async () => {
    const key = createKey()

    function Page() {
      const query = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage + 1,
      }))

      return createComponent(Suspense, {
        fallback: 'loading',
        get children() {
          return `pages: ${query.data?.pages}, status: ${query.status}, hasNextPage: ${query.hasNextPage}`
        },
      })
    }

    const markup = renderToString(Page)
    await vi.advanceTimersByTimeAsync(11)

    await expect(markup).resolves.toContain(
      'pages: 0, status: success, hasNextPage: true',
    )
  })
})
