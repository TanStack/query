import {
  QueryObserver,
  clearQueryClient,
  defaultQueryOptions,
} from '@tanstack/query-core'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { act } from '@testing-library/react'
import { Suspense } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryClient,
  QueryClientProvider,
  suspenseQueryOptions,
  useQuery,
} from '..'
import { getSuspensePromise } from '../suspense'
import { renderWithSuspense } from './utils'
import type { StaleTime } from '@tanstack/query-core'
import type { QueryKey } from '..'

function createTestQuery(options: {
  fetchCount: { count: number }
  queryKey: QueryKey
  staleTime?: StaleTime | (() => StaleTime)
}) {
  return function TestComponent() {
    const { data } = useQuery(
      suspenseQueryOptions({
        queryKey: options.queryKey,
        queryFn: () =>
          sleep(10).then(() => {
            options.fetchCount.count++
            return 'data'
          }),
        staleTime: options.staleTime,
      }),
    )
    return <div>data: {data}</div>
  }
}

describe('Suspense Timer Tests', () => {
  let queryClient: QueryClient
  let fetchCount: { count: number }

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    fetchCount = { count: 0 }
  })

  afterEach(() => {
    clearQueryClient(queryClient)
    vi.useRealTimers()
  })

  it('should reuse the suspense promise while a query is pending', async () => {
    const key = createKey()
    const options = defaultQueryOptions(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data'),
      suspense: true,
    })
    const observer = new QueryObserver(queryClient, options)
    const errorResetBoundary = {
      clearReset: vi.fn<() => void>(),
      isReset: () => false,
      reset: vi.fn<() => void>(),
    }

    const firstPromise = getSuspensePromise(
      queryClient,
      options,
      observer,
      errorResetBoundary,
      observer.getCurrentQuery(),
    )
    const secondPromise = getSuspensePromise(
      queryClient,
      options,
      observer,
      errorResetBoundary,
      observer.getCurrentQuery(),
    )

    expect(secondPromise).toBe(firstPromise)

    await vi.advanceTimersByTimeAsync(10)
    await firstPromise
  })

  it('should create a new suspense promise when fetching again after it settles', async () => {
    const key = createKey()
    const options = defaultQueryOptions(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data'),
      suspense: true,
    })
    const observer = new QueryObserver(queryClient, options)
    const errorResetBoundary = {
      clearReset: vi.fn<() => void>(),
      isReset: () => false,
      reset: vi.fn<() => void>(),
    }

    const firstPromise = getSuspensePromise(
      queryClient,
      options,
      observer,
      errorResetBoundary,
      observer.getCurrentQuery(),
    )

    await vi.advanceTimersByTimeAsync(10)
    await firstPromise

    const secondPromise = getSuspensePromise(
      queryClient,
      options,
      observer,
      errorResetBoundary,
      observer.getCurrentQuery(),
    )

    expect(secondPromise).not.toBe(firstPromise)

    await vi.advanceTimersByTimeAsync(10)
    await secondPromise
  })

  it('should enforce minimum staleTime of 1000ms when using suspense with number', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: createKey(),
      staleTime: 10,
    })

    const rendered = await renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await act(() => vi.advanceTimersByTimeAsync(100))
    expect(fetchCount.count).toBe(1)
  })

  it('should enforce minimum staleTime of 1000ms when using suspense with function', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: createKey(),
      staleTime: () => 10,
    })

    const rendered = await renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await act(() => vi.advanceTimersByTimeAsync(100))
    expect(fetchCount.count).toBe(1)
  })

  it('should respect staleTime when value is greater than 1000ms', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: createKey(),
      staleTime: 2000,
    })

    const rendered = await renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await act(() => vi.advanceTimersByTimeAsync(1500))
    expect(fetchCount.count).toBe(1)
  })

  it('should enforce minimum staleTime when undefined is provided', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: createKey(),
      staleTime: undefined,
    })

    const rendered = await renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(fetchCount.count).toBe(1)
  })

  it('should preserve staleTime when value is static', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: createKey(),
      staleTime: 'static',
    })

    const rendered = await renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(fetchCount.count).toBe(1)
  })

  it('should preserve staleTime when function returns static', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: createKey(),
      staleTime: () => 'static',
    })

    const rendered = await renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(fetchCount.count).toBe(1)
  })

  it('should respect staleTime when function returns value greater than 1000ms', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: createKey(),
      staleTime: () => 3000,
    })

    const rendered = await renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(fetchCount.count).toBe(1)
  })
})
