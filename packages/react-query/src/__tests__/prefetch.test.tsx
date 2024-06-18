import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import {
  QueryCache,
  infiniteQueryOptions,
  queryOptions,
  usePrefetchInfiniteQuery,
  usePrefetchQuery,
  useQueryErrorResetBoundary,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '..'
import { createQueryClient, queryKey, renderWithClient, sleep } from './utils'

import type { UseQueryOptions } from '..'
import type { Mock } from 'vitest'

function createQueryOptions<T>(params: { sleepInterval?: number; data: T }) {
  const { sleepInterval = 10, data } = params

  const queryFn = vi.fn().mockImplementation(async () => {
    await sleep(sleepInterval)

    return data
  })

  return queryOptions({
    queryKey: queryKey(),
    queryFn,
  })
}

function createInfiniteQueryOptions(params: {
  sleepInterval?: number
  pages: Array<string>
}) {
  const { sleepInterval = 10, pages } = params

  let currentPage = 0

  return infiniteQueryOptions({
    queryKey: queryKey(),
    queryFn: vi.fn().mockImplementation(async () => {
      const data = pages[currentPage] || undefined
      await sleep(sleepInterval)
      currentPage++

      return {
        page: currentPage,
        totalPages: pages.length,
        data,
      }
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page === lastPage.totalPages) {
        return undefined
      }

      return lastPage.page + 1
    },
  })
}

describe('usePrefetchQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  function Suspended(props: {
    queryOpts: UseQueryOptions<any, Error, any, Array<string>>
  }) {
    const state = useSuspenseQuery(props.queryOpts)

    return (
      <div>
        <div>data: {String(state.data)}</div>
      </div>
    )
  }

  it('should prefetch query if query state does not exist', async () => {
    const queryOpts = createQueryOptions({
      data: 'Prefetch is nice!',
    })

    function App() {
      usePrefetchQuery(queryOpts)

      return (
        <React.Suspense fallback="Loading...">
          <Suspended queryOpts={queryOpts} />
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('data: Prefetch is nice!'))
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not prefetch query if query state exists', async () => {
    const queryOpts = createQueryOptions({ data: 'Prefetch is really nice!' })

    function App() {
      usePrefetchQuery(queryOpts)

      return (
        <React.Suspense fallback="Loading...">
          <Suspended queryOpts={queryOpts} />
        </React.Suspense>
      )
    }

    await queryClient.fetchQuery(queryOpts)
    ;(queryOpts.queryFn as Mock).mockClear()
    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.queryByText('fetching: true')).not.toBeInTheDocument()
    await waitFor(() => rendered.getByText('data: Prefetch is really nice!'))
    expect(queryOpts.queryFn).not.toHaveBeenCalled()
  })

  it('should display an error boundary if query cache is populated with an error', async () => {
    const queryOpts = createQueryOptions({ data: 'Not an error' })
    ;(queryOpts.queryFn as Mock).mockImplementationOnce(async () => {
      await sleep(10)

      throw new Error('Oops! Server error!')
    })

    function App() {
      usePrefetchQuery(queryOpts)

      return (
        <ErrorBoundary fallbackRender={() => <div>Oops!</div>}>
          <React.Suspense fallback="Loading...">
            <Suspended queryOpts={queryOpts} />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    await queryClient.prefetchQuery(queryOpts)
    ;(queryOpts.queryFn as Mock).mockClear()
    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Oops!'))
    expect(rendered.queryByText('data: Not an error')).not.toBeInTheDocument()
    expect(queryOpts.queryFn).not.toHaveBeenCalled()
  })

  it('should be able to recover from errors and try fetching again', async () => {
    const queryOpts = createQueryOptions({ data: 'This is fine :dog: :fire:' })
    ;(queryOpts.queryFn as Mock).mockImplementationOnce(async () => {
      await sleep(10)

      throw new Error('Oops! Server error!')
    })

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
            <Suspended queryOpts={queryOpts} />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    await queryClient.prefetchQuery(queryOpts)
    ;(queryOpts.queryFn as Mock).mockClear()

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Oops!'))
    fireEvent.click(rendered.getByText('Try again'))
    await waitFor(() => rendered.getByText('data: This is fine :dog: :fire:'))
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not create a suspense waterfall if prefetch is fired', async () => {
    const firstQueryOpts = createQueryOptions({ data: 'Prefetch is nice!' })

    const secondQueryOpts = createQueryOptions({
      data: 'Prefetch is really nice!!',
    })

    const thirdQueryOpts = createQueryOptions({
      data: 'Prefetch does not create waterfalls!!',
    })

    const Fallback = vi.fn().mockImplementation(() => <div>Loading...</div>)

    function App() {
      usePrefetchQuery(firstQueryOpts)
      usePrefetchQuery(secondQueryOpts)
      usePrefetchQuery(thirdQueryOpts)

      return (
        <React.Suspense fallback={<Fallback />}>
          <Suspended queryOpts={firstQueryOpts} />
          <Suspended queryOpts={secondQueryOpts} />
          <Suspended queryOpts={thirdQueryOpts} />
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
    expect(firstQueryOpts.queryFn).toHaveBeenCalledTimes(1)
    expect(secondQueryOpts.queryFn).toHaveBeenCalledTimes(1)
    expect(thirdQueryOpts.queryFn).toHaveBeenCalledTimes(1)
  })
})

describe('usePrefetchInfiniteQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  const Fallback = vi.fn().mockImplementation(() => <div>Loading...</div>)

  function Suspended(props: { queryOpts: any }) {
    const state = useSuspenseInfiniteQuery(props.queryOpts)

    return (
      <div>
        {(state.data.pages as Array<{ page: number; data: string }>).map(
          (page) => (
            <div key={page.page}>data: {page.data}</div>
          ),
        )}
        <button onClick={() => state.fetchNextPage()}>Next Page</button>
      </div>
    )
  }

  it('should prefetch an infinite query if query state does not exist', async () => {
    const queryOpts = createInfiniteQueryOptions({
      pages: [
        'Do you fetch on render?',
        'Or do you render as you fetch?',
        'Either way, Tanstack Query helps you!',
      ],
    })

    function App() {
      usePrefetchInfiniteQuery(queryOpts)

      return (
        <React.Suspense fallback={<Fallback />}>
          <Suspended queryOpts={queryOpts} />
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('data: Do you fetch on render?'))
    fireEvent.click(rendered.getByText('Next Page'))
    await waitFor(() =>
      rendered.getByText('data: Or do you render as you fetch?'),
    )
    fireEvent.click(rendered.getByText('Next Page'))
    await waitFor(() =>
      rendered.getByText('data: Either way, Tanstack Query helps you!'),
    )
    expect(Fallback).toHaveBeenCalledTimes(1)
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(3)
  })

  it('should not display fallback if the query cache is already populated', async () => {
    const queryOpts = createInfiniteQueryOptions({
      pages: ['Prefetch rocks!', 'No waterfalls, boy!', 'Tanstack Query #ftw'],
    })

    await queryClient.prefetchInfiniteQuery({ ...queryOpts, pages: 3 })
    ;(queryOpts.queryFn as Mock).mockClear()

    function App() {
      usePrefetchInfiniteQuery(queryOpts)

      return (
        <React.Suspense fallback={<Fallback />}>
          <Suspended queryOpts={queryOpts} />
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('data: Prefetch rocks!'))
    fireEvent.click(rendered.getByText('Next Page'))
    await waitFor(() => rendered.getByText('data: No waterfalls, boy!'))
    fireEvent.click(rendered.getByText('Next Page'))
    await waitFor(() => rendered.getByText('data: Tanstack Query #ftw'))
    expect(queryOpts.queryFn).not.toHaveBeenCalled()
    expect(Fallback).not.toHaveBeenCalled()
  })
})
