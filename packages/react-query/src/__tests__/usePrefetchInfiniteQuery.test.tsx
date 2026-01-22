import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { act, fireEvent } from '@testing-library/react'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  usePrefetchInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '..'
import { renderWithClient } from './utils'
import type { InfiniteData, UseSuspenseInfiniteQueryOptions } from '..'
import type { Mock } from 'vitest'

const createFallback = () =>
  vi.fn().mockImplementation(() => <div>Loading...</div>)

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

describe('usePrefetchInfiniteQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  function Suspended<T = unknown>(props: {
    queryOpts: UseSuspenseInfiniteQueryOptions<
      T,
      Error,
      InfiniteData<T>,
      Array<string>,
      any
    >
    renderPage: (page: T) => React.JSX.Element
  }) {
    const state = useSuspenseInfiniteQuery(props.queryOpts)

    return (
      <div>
        {state.data.pages.map((page, index) => (
          <div key={index}>{props.renderPage(page)}</div>
        ))}
        <button onClick={() => state.fetchNextPage()}>Next Page</button>
      </div>
    )
  }

  it('should prefetch an infinite query if query state does not exist', async () => {
    const Fallback = createFallback()
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

    await act(() => vi.advanceTimersByTimeAsync(30))
    rendered.getByText('data: Do you fetch on render?')
    fireEvent.click(rendered.getByText('Next Page'))
    expect(
      rendered.getByText('data: Or do you render as you fetch?'),
    ).toBeInTheDocument()
    fireEvent.click(rendered.getByText('Next Page'))
    expect(
      rendered.getByText('data: Either way, Tanstack Query helps you!'),
    ).toBeInTheDocument()
    expect(Fallback).toHaveBeenCalledTimes(1)
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(3)
  })

  it('should not display fallback if the query cache is already populated', async () => {
    const Fallback = createFallback()
    const queryOpts = {
      queryKey: queryKey(),
      ...generateInfiniteQueryOptions([
        { data: 'Prefetch rocks!', currentPage: 1, totalPages: 3 },
        { data: 'No waterfalls, boy!', currentPage: 2, totalPages: 3 },
        { data: 'Tanstack Query #ftw', currentPage: 3, totalPages: 3 },
      ]),
    }

    queryClient.prefetchInfiniteQuery({ ...queryOpts, pages: 3 })
    await vi.advanceTimersByTimeAsync(30)
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

    expect(rendered.getByText('data: Prefetch rocks!')).toBeInTheDocument()
    fireEvent.click(rendered.getByText('Next Page'))
    expect(rendered.getByText('data: No waterfalls, boy!')).toBeInTheDocument()
    fireEvent.click(rendered.getByText('Next Page'))
    expect(rendered.getByText('data: Tanstack Query #ftw')).toBeInTheDocument()
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

    await act(() => vi.advanceTimersByTimeAsync(10))
    rendered.getByText('data: Infinite Page 1')
    fireEvent.click(rendered.getByText('Next Page'))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('data: Infinite Page 2')).toBeInTheDocument()
    fireEvent.click(rendered.getByText('Next Page'))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('data: Infinite Page 3')).toBeInTheDocument()
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(3)
  })
})
