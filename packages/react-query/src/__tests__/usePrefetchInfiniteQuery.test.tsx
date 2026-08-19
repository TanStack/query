import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act, fireEvent } from '@testing-library/react'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  usePrefetchInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '..'
import { renderWithClient } from './utils'

describe('usePrefetchInfiniteQuery', () => {
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

  it('should prefetch an infinite query if query state does not exist', async () => {
    const Fallback = vi.fn().mockImplementation(() => <div>Loading...</div>)
    const data = [
      'Do you fetch on render?',
      'Or do you render as you fetch?',
      'Either way, Tanstack Query helps you!',
    ]

    const queryOpts = {
      queryKey: queryKey(),
      queryFn: vi
        .fn<(context: { pageParam: number }) => Promise<string>>()
        .mockImplementation(({ pageParam }) =>
          sleep(10).then(() => data[pageParam]!),
        ),
      initialPageParam: 0,
      getNextPageParam: (_lastPage: string, allPages: Array<string>) =>
        allPages.length < data.length ? allPages.length : undefined,
    }

    function Page() {
      const state = useSuspenseInfiniteQuery(queryOpts)

      return (
        <div>
          {state.data.pages.map((page, index) => (
            <div key={index}>data: {page}</div>
          ))}
          <button onClick={() => state.fetchNextPage()}>Next Page</button>
        </div>
      )
    }

    function App() {
      usePrefetchInfiniteQuery({ ...queryOpts, pages: data.length })

      return (
        <React.Suspense fallback={<Fallback />}>
          <Page />
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
    const Fallback = vi.fn().mockImplementation(() => <div>Loading...</div>)
    const data = [
      'Prefetch rocks!',
      'No waterfalls, boy!',
      'Tanstack Query #ftw',
    ]

    const queryOpts = {
      queryKey: queryKey(),
      queryFn: vi
        .fn<(context: { pageParam: number }) => Promise<string>>()
        .mockImplementation(({ pageParam }) =>
          sleep(10).then(() => data[pageParam]!),
        ),
      initialPageParam: 0,
      getNextPageParam: (_lastPage: string, allPages: Array<string>) =>
        allPages.length < data.length ? allPages.length : undefined,
    }

    queryClient.prefetchInfiniteQuery({ ...queryOpts, pages: 3 })
    await vi.advanceTimersByTimeAsync(30)
    queryOpts.queryFn.mockClear()

    function Page() {
      const state = useSuspenseInfiniteQuery(queryOpts)

      return (
        <div>
          {state.data.pages.map((page, index) => (
            <div key={index}>data: {page}</div>
          ))}
          <button onClick={() => state.fetchNextPage()}>Next Page</button>
        </div>
      )
    }

    function App() {
      usePrefetchInfiniteQuery(queryOpts)

      return (
        <React.Suspense fallback={<Fallback />}>
          <Page />
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
    const data = ['Infinite Page 1', 'Infinite Page 2', 'Infinite Page 3']

    const queryOpts = {
      queryKey: queryKey(),
      queryFn: vi
        .fn<(context: { pageParam: number }) => Promise<string>>()
        .mockImplementation(({ pageParam }) =>
          sleep(10).then(() => data[pageParam]!),
        ),
      initialPageParam: 0,
      // always reports another page available, to guard against an endless
      // auto-advance loop rather than a bounded pagination sequence
      getNextPageParam: (_lastPage: string, allPages: Array<string>) =>
        allPages.length,
    }

    function Prefetch({ children }: { children: React.ReactNode }) {
      usePrefetchInfiniteQuery(queryOpts)
      return <>{children}</>
    }

    function Page() {
      const state = useSuspenseInfiniteQuery(queryOpts)

      return (
        <div>
          {state.data.pages.map((page, index) => (
            <div key={index}>data: {page}</div>
          ))}
          <button onClick={() => state.fetchNextPage()}>Next Page</button>
        </div>
      )
    }

    function App() {
      return (
        <React.Suspense>
          <Prefetch>
            <Page />
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
