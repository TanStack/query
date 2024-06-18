import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import {
  QueryCache,
  usePrefetchInfiniteQuery,
  usePrefetchQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '..'
import { createQueryClient, queryKey, renderWithClient, sleep } from './utils'

describe('usePrefetchQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should prefetch query if query state does not exist', async () => {
    const queryOpts = {
      queryKey: queryKey(),
      queryFn: vi.fn().mockImplementation(async () => {
        await sleep(10)

        return 'Prefetch is nice!'
      }),
    }

    const anotherSpy = vi.fn()

    function Suspended() {
      const state = useSuspenseQuery({ ...queryOpts, queryFn: anotherSpy })

      return (
        <div>
          <div>data: {String(state.data)}</div>
          <div>fetching: {state.isFetching ? 'true' : 'false'}</div>
        </div>
      )
    }

    function App() {
      usePrefetchQuery(queryOpts)

      return (
        <React.Suspense fallback="Loading...">
          <Suspended />
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('data: Prefetch is nice!'))
    expect(rendered.queryByText('fetching: true')).not.toBeInTheDocument()
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(1)
    expect(anotherSpy).not.toHaveBeenCalled()
  })

  it('should not prefetch query if query state exists', async () => {
    const queryOpts = {
      queryKey: queryKey(),
      queryFn: vi.fn(),
    }

    queryOpts.queryFn.mockImplementation(async () => {
      await sleep(10)

      return 'Prefetch is really nice!'
    })

    function Suspended() {
      const state = useSuspenseQuery({ ...queryOpts, queryFn: vi.fn() })

      return (
        <div>
          <div>data: {String(state.data)}</div>
          <div>fetching: {state.isFetching ? 'true' : 'false'}</div>
        </div>
      )
    }

    function App() {
      usePrefetchQuery({ ...queryOpts, queryFn: vi.fn() })

      return (
        <React.Suspense fallback="Loading...">
          <Suspended />
        </React.Suspense>
      )
    }

    await queryClient.fetchQuery(queryOpts)
    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.queryByText('fetching: true')).not.toBeInTheDocument()
    expect(
      rendered.getByText('data: Prefetch is really nice!'),
    ).toBeInTheDocument()
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not create a suspense waterfall if prefetch is fired', async () => {
    const firstQueryOpts = {
      queryKey: queryKey(),
      queryFn: vi.fn().mockImplementation(async () => {
        await sleep(10)

        return 'Prefetch is nice!'
      }),
    }

    const secondQueryOpts = {
      queryKey: queryKey(),
      queryFn: vi.fn().mockImplementation(async () => {
        await sleep(10)

        return 'Prefetch is really nice!!'
      }),
    }

    const thirdQueryOpts = {
      queryKey: queryKey(),
      queryFn: vi.fn().mockImplementation(async () => {
        await sleep(10)

        return 'Prefetch does not create waterfalls!!'
      }),
    }

    function FirstSuspended() {
      const state = useSuspenseQuery(firstQueryOpts)

      return (
        <div>
          <div>data: {String(state.data)}</div>
        </div>
      )
    }

    function SecondSuspended() {
      const state = useSuspenseQuery(secondQueryOpts)

      return (
        <div>
          <div>data: {String(state.data)}</div>
        </div>
      )
    }

    function ThirdSuspended() {
      const state = useSuspenseQuery(thirdQueryOpts)

      return (
        <div>
          <div>data: {String(state.data)}</div>
        </div>
      )
    }

    function App() {
      usePrefetchQuery(firstQueryOpts)
      usePrefetchQuery(secondQueryOpts)
      usePrefetchQuery(thirdQueryOpts)

      const [showSecond, setShowSecond] = React.useState(false)
      const [showThird, setShowThird] = React.useState(false)

      return (
        <React.Suspense fallback="Loading...">
          <FirstSuspended />
          <button onClick={() => setShowSecond(true)}>showSecond</button>
          {showSecond ? <SecondSuspended /> : null}
          <button onClick={() => setShowThird(true)}>showThird</button>
          {showThird ? <ThirdSuspended /> : null}
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('data: Prefetch is nice!'))
    fireEvent.click(rendered.getByText('showSecond'))
    expect(rendered.queryByText('Loading...')).not.toBeInTheDocument()
    await waitFor(() => rendered.getByText('data: Prefetch is really nice!!'))
    fireEvent.click(rendered.getByText('showThird'))
    expect(rendered.queryByText('Loading...')).not.toBeInTheDocument()
    await waitFor(() =>
      rendered.getByText('data: Prefetch does not create waterfalls!!'),
    )
  })
})

describe('usePrefetchInfiniteQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should prefetch an infinite query if query state does not exist', async () => {
    const pages = [
      'Do you fetch on render?',
      'Or do you render as you fetch?',
      'Either way, Tanstack Query helps you!',
    ]

    let queryPage = 0

    const queryOpts = {
      queryKey: queryKey(),
      queryFn: vi
        .fn<any, Promise<{ page: number; totalPages: number; data: string }>>()
        .mockImplementation(async () => {
          const data = pages[queryPage] || ''
          await sleep(10)
          queryPage++
          return {
            page: queryPage,
            totalPages: pages.length,
            data,
          }
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage: any) => {
        if (lastPage.page === lastPage.totalPages) {
          return undefined
        }

        return lastPage.page + 1
      },
      pages: 3,
    }

    function Suspended() {
      const state = useSuspenseInfiniteQuery(queryOpts)

      return (
        <div>
          {state.data.pages.map((page) => (
            <div key={page.page}>data: {page.data}</div>
          ))}
          <button onClick={() => state.fetchNextPage()}>Next Page</button>
        </div>
      )
    }

    function App() {
      usePrefetchInfiniteQuery(queryOpts)

      return (
        <React.Suspense fallback="Loading...">
          <Suspended />
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('data: Do you fetch on render?'))
    fireEvent.click(rendered.getByText('Next Page'))
    expect(rendered.queryByText('Loading...')).not.toBeInTheDocument()
    await waitFor(() =>
      rendered.getByText('data: Or do you render as you fetch?'),
    )
    fireEvent.click(rendered.getByText('Next Page'))
    expect(rendered.queryByText('Loading...')).not.toBeInTheDocument()
    await waitFor(() =>
      rendered.getByText('data: Either way, Tanstack Query helps you!'),
    )
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(3)
  })

  it('should not prefetch an infinite query if query state already exists', async () => {
    const pages = [
      'Prefetch rocks!',
      'No waterfalls, boy!',
      'Tanstack Query #ftw',
    ]

    let queryPage = 0

    const queryOpts = {
      queryKey: queryKey(),
      queryFn: vi
        .fn<any, Promise<{ page: number; totalPages: number; data: string }>>()
        .mockImplementation(async () => {
          const data = pages[queryPage] || ''
          await sleep(10)
          queryPage++
          return {
            page: queryPage,
            totalPages: pages.length,
            data,
          }
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage: any) => {
        if (lastPage.page === lastPage.totalPages) {
          return undefined
        }

        return lastPage.page + 1
      },
      pages: 3,
    }

    function Suspended() {
      const state = useSuspenseInfiniteQuery(queryOpts)

      return (
        <div>
          {state.data.pages.map((page) => (
            <div key={page.page}>data: {page.data}</div>
          ))}
          <button onClick={() => state.fetchNextPage()}>Next Page</button>
        </div>
      )
    }

    await queryClient.prefetchInfiniteQuery(queryOpts)

    function App() {
      usePrefetchInfiniteQuery(queryOpts)

      return (
        <React.Suspense fallback="Loading...">
          <Suspended />
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.queryByText('Loading...')).not.toBeInTheDocument()
    await waitFor(() => rendered.getByText('data: Prefetch rocks!'))
    fireEvent.click(rendered.getByText('Next Page'))
    expect(rendered.queryByText('Loading...')).not.toBeInTheDocument()
    await waitFor(() => rendered.getByText('data: No waterfalls, boy!'))
    fireEvent.click(rendered.getByText('Next Page'))
    expect(rendered.queryByText('Loading...')).not.toBeInTheDocument()
    await waitFor(() => rendered.getByText('data: Tanstack Query #ftw'))
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(3)
  })
})
