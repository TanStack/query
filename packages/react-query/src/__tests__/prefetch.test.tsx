import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import {
  QueryCache,
  usePrefetchInfiniteQuery,
  usePrefetchQuery,
  useQueryErrorResetBoundary,
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

    const suspendedQueryFn = vi.fn()

    function Suspended() {
      const state = useSuspenseQuery({
        ...queryOpts,
        queryFn: suspendedQueryFn,
      })

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
    expect(suspendedQueryFn).not.toHaveBeenCalled()
  })

  it('should not prefetch query if query state exists', async () => {
    const queryFn = vi.fn().mockImplementation(async () => {
      await sleep(10)

      return 'Prefetch is really nice!'
    })

    const queryOpts = {
      queryKey: queryKey(),
      queryFn,
    }

    const suspendedQueryFn = vi.fn()

    function Suspended() {
      const state = useSuspenseQuery({
        ...queryOpts,
        queryFn: suspendedQueryFn,
      })

      return (
        <div>
          <div>data: {String(state.data)}</div>
          <div>fetching: {state.isFetching ? 'true' : 'false'}</div>
        </div>
      )
    }

    function App() {
      usePrefetchQuery({ ...queryOpts, queryFn: suspendedQueryFn })

      return (
        <React.Suspense fallback="Loading...">
          <Suspended />
        </React.Suspense>
      )
    }

    await queryClient.fetchQuery(queryOpts)
    queryFn.mockClear()
    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.queryByText('fetching: true')).not.toBeInTheDocument()
    await waitFor(() => rendered.getByText('data: Prefetch is really nice!'))
    expect(suspendedQueryFn).not.toHaveBeenCalled()
    expect(queryOpts.queryFn).not.toHaveBeenCalled()
  })

  it('should display an error boundary if query cache is populated with an error', async () => {
    const queryFn = vi.fn()

    const queryOpts = {
      queryKey: queryKey(),
      queryFn,
    }

    const suspendedQueryFn = vi.fn()

    function Suspended() {
      const state = useSuspenseQuery({
        ...queryOpts,
        queryFn: suspendedQueryFn,
      })

      return (
        <div>
          <div>data: {String(state.data)}</div>
        </div>
      )
    }

    function App() {
      usePrefetchQuery(queryOpts)

      return (
        <ErrorBoundary fallbackRender={() => <div>Oops!</div>}>
          <React.Suspense fallback="Loading...">
            <Suspended />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    queryFn.mockImplementationOnce(async () => {
      await sleep(10)

      throw new Error('Oops! Server error!')
    })

    await queryClient.prefetchQuery(queryOpts)
    queryFn.mockClear()
    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Oops!'))
    expect(queryFn).not.toHaveBeenCalled()
    expect(suspendedQueryFn).not.toHaveBeenCalled()
  })

  it('should be able to recover from errors and try fetching again', async () => {
    const queryFn = vi.fn()

    const queryOpts = {
      queryKey: queryKey(),
      queryFn,
    }

    const suspendedQueryFn = vi.fn()

    function Suspended() {
      const state = useSuspenseQuery({
        ...queryOpts,
        queryFn: suspendedQueryFn.mockImplementationOnce(async () => {
          await sleep(10)

          return 'This is fine :dog: :fire:'
        }),
      })

      return (
        <div>
          <div>data: {String(state.data)}</div>
        </div>
      )
    }

    function App() {
      const { reset } = useQueryErrorResetBoundary()
      usePrefetchQuery(queryOpts)

      return (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div>
              <div>Oops!</div>
              <button onClick={resetErrorBoundary}>Try again</button>
            </div>
          )}
        >
          <React.Suspense fallback="Loading...">
            <Suspended />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    queryFn.mockImplementationOnce(async () => {
      await sleep(10)

      throw new Error('Oops! Server error!')
    })

    await queryClient.prefetchQuery(queryOpts)

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Oops!'))
    fireEvent.click(rendered.getByText('Try again'))
    await waitFor(() => rendered.getByText('data: This is fine :dog: :fire:'))
    expect(suspendedQueryFn).toHaveBeenCalled()
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

    const suspendedQueryFn = vi.fn()

    function FirstSuspended() {
      const state = useSuspenseQuery({
        ...firstQueryOpts,
        queryFn: suspendedQueryFn,
      })

      return (
        <div>
          <div>data: {String(state.data)}</div>
        </div>
      )
    }

    function SecondSuspended() {
      const state = useSuspenseQuery({
        ...secondQueryOpts,
        queryFn: suspendedQueryFn,
      })

      return (
        <div>
          <div>data: {String(state.data)}</div>
        </div>
      )
    }

    function ThirdSuspended() {
      const state = useSuspenseQuery({
        ...thirdQueryOpts,
        queryFn: suspendedQueryFn,
      })

      return (
        <div>
          <div>data: {String(state.data)}</div>
        </div>
      )
    }

    const Fallback = vi.fn().mockImplementation(() => <div>Loading...</div>)

    function App() {
      usePrefetchQuery(firstQueryOpts)
      usePrefetchQuery(secondQueryOpts)
      usePrefetchQuery(thirdQueryOpts)

      return (
        <React.Suspense fallback={<Fallback />}>
          <FirstSuspended />
          <SecondSuspended />
          <ThirdSuspended />
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('data: Prefetch is nice!'))
    await waitFor(() => rendered.getByText('data: Prefetch is really nice!!'))
    await waitFor(() =>
      rendered.getByText('data: Prefetch does not create waterfalls!!'),
    )
    expect(Fallback).toHaveBeenCalledTimes(1)
    expect(suspendedQueryFn).not.toHaveBeenCalled()
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

    const suspendedQueryFn = vi.fn()

    function Suspended() {
      const state = useSuspenseInfiniteQuery({
        ...queryOpts,
        queryFn: suspendedQueryFn,
      })

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
    expect(suspendedQueryFn).not.toHaveBeenCalled()
  })

  it('should not prefetch an infinite query if query state already exists', async () => {
    const pages = [
      'Prefetch rocks!',
      'No waterfalls, boy!',
      'Tanstack Query #ftw',
    ]

    let queryPage = 0

    const suspendedQueryFn = vi.fn()

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
      const state = useSuspenseInfiniteQuery({
        ...queryOpts,
        queryFn: suspendedQueryFn,
      })

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
      usePrefetchInfiniteQuery({ ...queryOpts, queryFn: suspendedQueryFn })

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
    expect(suspendedQueryFn).not.toHaveBeenCalled()
  })
})
