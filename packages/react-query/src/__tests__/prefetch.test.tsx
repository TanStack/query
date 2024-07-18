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

import type { InfiniteData, UseInfiniteQueryOptions, UseQueryOptions } from '..'
import type { Mock } from 'vitest'

const generateQueryFn = (data: string) =>
  vi
    .fn<(...args: Array<any>) => Promise<string>>()
    .mockImplementation(async () => {
      await sleep(10)

      return data
    })

const generateInfiniteQueryOptions = (
  data: Array<{ data: string; currentPage: number; totalPages: number }>,
) => {
  let currentPage = 0

  return {
    queryFn: vi
      .fn<(...args: Array<any>) => Promise<(typeof data)[number]>>()
      .mockImplementation(async () => {
        const currentPageData = data[currentPage]
        if (!currentPageData) {
          throw new Error('No data defined for page ' + currentPage)
        }

        await sleep(10)
        currentPage++

        return currentPageData
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: (typeof data)[number]) =>
      lastPage.currentPage === lastPage.totalPages
        ? undefined
        : lastPage.currentPage + 1,
  }
}

describe('usePrefetchQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  function Suspended<TData = unknown>(props: {
    queryOpts: UseQueryOptions<TData, Error, TData, Array<string>>
    children?: React.ReactNode
  }) {
    const state = useSuspenseQuery(props.queryOpts)

    return (
      <div>
        <div>data: {String(state.data)}</div>
        {props.children}
      </div>
    )
  }

  it('should prefetch query if query state does not exist', async () => {
    const queryOpts = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('prefetchQuery'),
    }

    const componentQueryOpts = {
      ...queryOpts,
      queryFn: generateQueryFn('useSuspenseQuery'),
    }

    function App() {
      usePrefetchQuery(queryOpts)

      return (
        <React.Suspense fallback="Loading...">
          <Suspended queryOpts={componentQueryOpts} />
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('data: prefetchQuery'))
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not prefetch query if query state exists', async () => {
    const queryOpts = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('The usePrefetchQuery hook is smart!'),
    }

    function App() {
      usePrefetchQuery(queryOpts)

      return (
        <React.Suspense fallback="Loading...">
          <Suspended queryOpts={queryOpts} />
        </React.Suspense>
      )
    }

    await queryClient.fetchQuery(queryOpts)
    queryOpts.queryFn.mockClear()
    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.queryByText('fetching: true')).not.toBeInTheDocument()
    await waitFor(() =>
      rendered.getByText('data: The usePrefetchQuery hook is smart!'),
    )
    expect(queryOpts.queryFn).not.toHaveBeenCalled()
  })

  it('should let errors fall through and not refetch failed queries', async () => {
    const queryFn = generateQueryFn('Not an error')

    const queryOpts = {
      queryKey: queryKey(),
      queryFn,
    }

    queryFn.mockImplementationOnce(async () => {
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
    queryFn.mockClear()
    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Oops!'))
    expect(rendered.queryByText('data: Not an error')).not.toBeInTheDocument()
    expect(queryOpts.queryFn).not.toHaveBeenCalled()
  })

  it('should not create an endless loop when using inside a suspense boundary', async () => {
    const queryFn = generateQueryFn('prefetchedQuery')

    const queryOpts = {
      queryKey: queryKey(),
      queryFn,
    }

    function Prefetch({ children }: { children: React.ReactNode }) {
      usePrefetchQuery(queryOpts)
      return <>{children}</>
    }

    function App() {
      return (
        <React.Suspense>
          <Prefetch>
            <Suspended queryOpts={queryOpts} />
          </Prefetch>
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)
    await waitFor(() => rendered.getByText('data: prefetchedQuery'))
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(1)
  })

  it('should be able to recover from errors and try fetching again', async () => {
    const queryFn = generateQueryFn('This is fine :dog: :fire:')

    const queryOpts = {
      queryKey: queryKey(),
      queryFn,
    }

    queryFn.mockImplementationOnce(async () => {
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
    queryFn.mockClear()

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Oops!'))
    fireEvent.click(rendered.getByText('Try again'))
    await waitFor(() => rendered.getByText('data: This is fine :dog: :fire:'))
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not create a suspense waterfall if prefetch is fired', async () => {
    const firstQueryOpts = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('Prefetch is nice!'),
    }

    const secondQueryOpts = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('Prefetch is really nice!!'),
    }

    const thirdQueryOpts = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('Prefetch does not create waterfalls!!'),
    }

    const Fallback = vi.fn().mockImplementation(() => <div>Loading...</div>)

    function App() {
      usePrefetchQuery(firstQueryOpts)
      usePrefetchQuery(secondQueryOpts)
      usePrefetchQuery(thirdQueryOpts)

      return (
        <React.Suspense fallback={<Fallback />}>
          <Suspended queryOpts={firstQueryOpts}>
            <Suspended queryOpts={secondQueryOpts}>
              <Suspended queryOpts={thirdQueryOpts} />
            </Suspended>
          </Suspended>
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)
    expect(
      queryClient.getQueryState(firstQueryOpts.queryKey)?.fetchStatus,
    ).toBe('fetching')
    expect(
      queryClient.getQueryState(secondQueryOpts.queryKey)?.fetchStatus,
    ).toBe('fetching')
    expect(
      queryClient.getQueryState(thirdQueryOpts.queryKey)?.fetchStatus,
    ).toBe('fetching')
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

  function Suspended<T = unknown>(props: {
    queryOpts: UseInfiniteQueryOptions<
      T,
      Error,
      InfiniteData<T>,
      any,
      Array<string>,
      any
    >
    renderPage: (page: T) => React.JSX.Element
  }) {
    const state = useSuspenseInfiniteQuery(props.queryOpts)

    return (
      <div>
        {state.data.pages.map((page) => props.renderPage(page))}
        <button onClick={() => state.fetchNextPage()}>Next Page</button>
      </div>
    )
  }

  it('should prefetch an infinite query if query state does not exist', async () => {
    const data = [
      { data: 'Do you fetch on render?', currentPage: 1, totalPages: 3 },
      { data: 'Or do you render as you fetch?', currentPage: 2, totalPages: 3 },
      {
        data: 'Either way, Tanstack Query helps you!',
        currentPage: 3,
        totalPages: 3,
      },
    ]

    const queryOpts = {
      queryKey: queryKey(),
      ...generateInfiniteQueryOptions(data),
    }

    function App() {
      usePrefetchInfiniteQuery({ ...queryOpts, pages: data.length })

      return (
        <React.Suspense fallback={<Fallback />}>
          <Suspended
            queryOpts={queryOpts}
            renderPage={(page) => <div>data: {page.data}</div>}
          />
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
    const queryOpts = {
      queryKey: queryKey(),
      ...generateInfiniteQueryOptions([
        { data: 'Prefetch rocks!', currentPage: 1, totalPages: 3 },
        { data: 'No waterfalls, boy!', currentPage: 2, totalPages: 3 },
        { data: 'Tanstack Query #ftw', currentPage: 3, totalPages: 3 },
      ]),
    }

    await queryClient.prefetchInfiniteQuery({ ...queryOpts, pages: 3 })
    ;(queryOpts.queryFn as Mock).mockClear()

    function App() {
      usePrefetchInfiniteQuery(queryOpts)

      return (
        <React.Suspense fallback={<Fallback />}>
          <Suspended
            queryOpts={queryOpts}
            renderPage={(page) => <div>data: {page.data}</div>}
          />
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

  it('should not create an endless loop when using inside a suspense boundary', async () => {
    const queryOpts = {
      queryKey: queryKey(),
      ...generateInfiniteQueryOptions([
        { data: 'Infinite Page 1', currentPage: 1, totalPages: 3 },
        { data: 'Infinite Page 2', currentPage: 1, totalPages: 3 },
        { data: 'Infinite Page 3', currentPage: 1, totalPages: 3 },
      ]),
    }

    function Prefetch({ children }: { children: React.ReactNode }) {
      usePrefetchInfiniteQuery(queryOpts)
      return <>{children}</>
    }

    function App() {
      return (
        <React.Suspense>
          <Prefetch>
            <Suspended
              queryOpts={queryOpts}
              renderPage={(page) => <div>data: {page.data}</div>}
            />
          </Prefetch>
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)
    await waitFor(() => rendered.getByText('data: Infinite Page 1'))
    fireEvent.click(rendered.getByText('Next Page'))
    await waitFor(() => rendered.getByText('data: Infinite Page 2'))
    fireEvent.click(rendered.getByText('Next Page'))
    await waitFor(() => rendered.getByText('data: Infinite Page 3'))
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(3)
  })
})
