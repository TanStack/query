// useInfiniteQuery under the 2.0 read layer: same entry, same async data
// node — first load suspends, page fetches hold the committed pages (no
// fallback), and the pager surface (fetchNextPage / hasNextPage /
// isFetchingNextPage) derives from cache state plus the adapter's mirrored
// page-boundary checks.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Loading } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryCache, QueryClient, useInfiniteQuery } from '..'
import { renderWithClient } from './utils'

describe('useInfiniteQuery 2.0 read semantics', () => {
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

  function pagedQuery(key: ReadonlyArray<unknown>, lastPage = 3) {
    return {
      queryKey: key,
      queryFn: ({ pageParam }: { pageParam: number }) =>
        sleep(10).then(() => `page-${pageParam}`),
      initialPageParam: 0,
      getNextPageParam: (_last: string, pages: Array<string>) =>
        pages.length < lastPage ? pages.length : undefined,
      getPreviousPageParam: (first: string) => {
        const current = Number(first.split('-')[1])
        return current > 0 ? current - 1 : undefined
      },
    }
  }

  it('suspends on first load, then renders the first page', async () => {
    const key = queryKey()
    function Page() {
      const query = useInfiniteQuery(() => pagedQuery(key))
      return (
        <div>
          <span>pages: {query.data.pages.join(',')}</span>
          <span>hasNext: {String(query.hasNextPage)}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))
    expect(rendered.getByText('loading')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pages: page-0')).toBeInTheDocument()
    expect(rendered.getByText('hasNext: true')).toBeInTheDocument()
  })

  it('fetchNextPage appends while committed pages stay visible, with observable direction', async () => {
    const key = queryKey()
    function Page() {
      const query = useInfiniteQuery(() => pagedQuery(key))
      return (
        <div>
          <span>pages: {query.data.pages.join(',')}</span>
          <span>
            fetchingNext: {String(query.isFetchingNextPage)}, refetching:{' '}
            {String(query.isRefetching)}
          </span>
          <button onClick={() => void query.fetchNextPage()}>more</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pages: page-0')).toBeInTheDocument()

    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(0)
    // Page fetch in flight: committed page still on screen (no fallback),
    // direction observable, and NOT reported as a plain refetch.
    expect(rendered.getByText('pages: page-0')).toBeInTheDocument()
    expect(
      rendered.getByText('fetchingNext: true, refetching: false'),
    ).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pages: page-0,page-1')).toBeInTheDocument()
    expect(
      rendered.getByText('fetchingNext: false, refetching: false'),
    ).toBeInTheDocument()
  })

  it('hasNextPage turns false at the boundary', async () => {
    const key = queryKey()
    function Page() {
      const query = useInfiniteQuery(() => pagedQuery(key, 2))
      return (
        <div>
          <span>pages: {query.data.pages.join(',')}</span>
          <span>hasNext: {String(query.hasNextPage)}</span>
          <button onClick={() => void query.fetchNextPage()}>more</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('hasNext: true')).toBeInTheDocument()

    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pages: page-0,page-1')).toBeInTheDocument()
    expect(rendered.getByText('hasNext: false')).toBeInTheDocument()
  })

  it('fetchPreviousPage prepends', async () => {
    const key = queryKey()
    function Page() {
      const query = useInfiniteQuery(() => ({
        ...pagedQuery(key),
        initialPageParam: 2,
      }))
      return (
        <div>
          <span>pages: {query.data.pages.join(',')}</span>
          <span>hasPrev: {String(query.hasPreviousPage)}</span>
          <button onClick={() => void query.fetchPreviousPage()}>prev</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pages: page-2')).toBeInTheDocument()
    expect(rendered.getByText('hasPrev: true')).toBeInTheDocument()

    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pages: page-1,page-2')).toBeInTheDocument()
  })

  it('full refetch reports isRefetching, not a page fetch', async () => {
    const key = queryKey()
    function Page() {
      const query = useInfiniteQuery(() => pagedQuery(key))
      return (
        <div>
          <span>pages: {query.data.pages.join(',')}</span>
          <span>
            fetchingNext: {String(query.isFetchingNextPage)}, refetching:{' '}
            {String(query.isRefetching)}
          </span>
          <button onClick={() => void query.refetch()}>refetch</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))
    await vi.advanceTimersByTimeAsync(10)

    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText('fetchingNext: false, refetching: true'),
    ).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('fetchingNext: false, refetching: false'),
    ).toBeInTheDocument()
    expect(rendered.getByText('pages: page-0')).toBeInTheDocument()
  })
})
