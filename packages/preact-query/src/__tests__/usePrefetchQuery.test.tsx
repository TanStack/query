import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent } from '@testing-library/preact'
import { ErrorBoundary } from './ErrorBoundary'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  usePrefetchQuery,
  useQueryErrorResetBoundary,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'

import type { UseSuspenseQueryOptions } from '..'
import { Suspense } from 'preact/compat'
import { VNode } from 'preact'

const generateQueryFn = (data: string) =>
  vi
    .fn<(...args: Array<any>) => Promise<string>>()
    .mockImplementation(async () => {
      await sleep(10)

      return data
    })

describe('usePrefetchQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function Suspended<TData = unknown>(props: {
    queryOpts: UseSuspenseQueryOptions<TData, Error, TData, Array<string>>
    children?: VNode
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
        <Suspense fallback="Loading...">
          <Suspended queryOpts={componentQueryOpts} />
        </Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: prefetchQuery')).toBeInTheDocument()
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
        <Suspense fallback="Loading...">
          <Suspended queryOpts={queryOpts} />
        </Suspense>
      )
    }

    queryClient.fetchQuery(queryOpts)
    await vi.advanceTimersByTimeAsync(10)
    queryOpts.queryFn.mockClear()
    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.queryByText('fetching: true')).not.toBeInTheDocument()
    expect(
      rendered.getByText('data: The usePrefetchQuery hook is smart!'),
    ).toBeInTheDocument()
    expect(queryOpts.queryFn).not.toHaveBeenCalled()
  })

  it('should let errors fall through and not refetch failed queries', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)
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
          <Suspense fallback="Loading...">
            <Suspended queryOpts={queryOpts} />
          </Suspense>
        </ErrorBoundary>
      )
    }

    queryClient.prefetchQuery(queryOpts)
    await vi.advanceTimersByTimeAsync(10)
    queryFn.mockClear()
    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.getByText('Oops!')).toBeInTheDocument()
    expect(rendered.queryByText('data: Not an error')).not.toBeInTheDocument()
    expect(queryOpts.queryFn).not.toHaveBeenCalled()

    consoleMock.mockRestore()
  })

  it('should not create an endless loop when using inside a suspense boundary', async () => {
    const queryFn = generateQueryFn('prefetchedQuery')

    const queryOpts = {
      queryKey: queryKey(),
      queryFn,
    }

    function Prefetch({ children }: { children: VNode }) {
      usePrefetchQuery(queryOpts)
      return <>{children}</>
    }

    function App() {
      return (
        <Suspense fallback={<></>}>
          <Prefetch>
            <Suspended queryOpts={queryOpts} />
          </Prefetch>
        </Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: prefetchedQuery')).toBeInTheDocument()
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(1)
  })

  it('should be able to recover from errors and try fetching again', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)
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
          <Suspense fallback="Loading...">
            <Suspended queryOpts={queryOpts} />
          </Suspense>
        </ErrorBoundary>
      )
    }

    queryClient.prefetchQuery(queryOpts)
    await vi.advanceTimersByTimeAsync(10)
    queryFn.mockClear()

    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.getByText('Oops!')).toBeInTheDocument()
    fireEvent.click(rendered.getByText('Try again'))
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('data: This is fine :dog: :fire:'),
    ).toBeInTheDocument()
    expect(queryOpts.queryFn).toHaveBeenCalledTimes(1)
    consoleMock.mockRestore()
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
        <Suspense fallback={<Fallback />}>
          <Suspended queryOpts={firstQueryOpts}>
            <Suspended queryOpts={secondQueryOpts}>
              <Suspended queryOpts={thirdQueryOpts} />
            </Suspended>
          </Suspended>
        </Suspense>
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
    expect(rendered.getByText('Loading...')).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(rendered.getByText('data: Prefetch is nice!')).toBeInTheDocument()
    expect(
      rendered.getByText('data: Prefetch is really nice!!'),
    ).toBeInTheDocument()
    expect(
      rendered.getByText('data: Prefetch does not create waterfalls!!'),
    ).toBeInTheDocument()
    expect(Fallback).toHaveBeenCalledTimes(1)
    expect(firstQueryOpts.queryFn).toHaveBeenCalledTimes(1)
    expect(secondQueryOpts.queryFn).toHaveBeenCalledTimes(1)
    expect(thirdQueryOpts.queryFn).toHaveBeenCalledTimes(1)
  })
})
