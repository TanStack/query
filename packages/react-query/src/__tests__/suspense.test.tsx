import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import { Suspense } from 'react'
import { QueryObserver } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, QueryClientProvider, useSuspenseQuery } from '..'
import { fallbackUse, getSuspensePromise } from '../suspense'
import { renderWithSuspense } from './utils'
import type { StaleTime } from '@tanstack/query-core'
import type { QueryKey } from '..'

function createTestQuery(options: {
  fetchCount: { count: number }
  queryKey: QueryKey
  staleTime?: StaleTime | (() => StaleTime)
}) {
  return function TestComponent() {
    const { data } = useSuspenseQuery({
      queryKey: options.queryKey,
      queryFn: () =>
        sleep(10).then(() => {
          options.fetchCount.count++
          return 'data'
        }),
      staleTime: options.staleTime,
    })
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
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should reuse the suspense promise while a query is pending', async () => {
    const key = queryKey()
    const options = queryClient.defaultQueryOptions({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data'),
      suspense: true,
    })
    const observer = new QueryObserver(queryClient, options)
    const errorResetBoundary = {
      clearReset: vi.fn(),
      isReset: () => false,
      reset: vi.fn(),
    }

    const firstPromise = getSuspensePromise(
      options,
      observer,
      errorResetBoundary,
    )
    const secondPromise = getSuspensePromise(
      options,
      observer,
      errorResetBoundary,
    )

    expect(secondPromise).toBe(firstPromise)

    await vi.advanceTimersByTimeAsync(10)
    await firstPromise
  })

  it('should support pending, fulfilled, and rejected promise states in the React 18 fallback', async () => {
    let resolvePending!: (value: string) => void
    const pending = new Promise<string>((resolve) => {
      resolvePending = resolve
    })

    let thrown: unknown
    try {
      fallbackUse(pending)
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBe(pending)

    resolvePending('data')
    await pending
    expect(fallbackUse(pending)).toBe('data')

    const error = new Error('error')
    const rejected = Promise.reject(error)
    try {
      fallbackUse(rejected)
    } catch (rejectedPromise) {
      thrown = rejectedPromise
    }
    expect(thrown).toBe(rejected)

    await rejected.catch(() => undefined)
    expect(() => fallbackUse(rejected)).toThrow(error)
  })

  it('should enforce minimum staleTime of 1000ms when using suspense with number', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: queryKey(),
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
      queryKey: queryKey(),
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
      queryKey: queryKey(),
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
      queryKey: queryKey(),
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
      queryKey: queryKey(),
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
      queryKey: queryKey(),
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
      queryKey: queryKey(),
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
