import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { Suspense } from 'react'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient, QueryClientProvider, useSuspenseQuery } from '..'
import type { QueryKey } from '..'

function renderWithSuspense(client: QueryClient, ui: React.ReactNode) {
  return render(
    <QueryClientProvider client={client}>
      <Suspense fallback="loading">{ui}</Suspense>
    </QueryClientProvider>,
  )
}

function createTestQuery(options: {
  fetchCount: { count: number }
  queryKey: QueryKey
  staleTime?: number | (() => number)
}) {
  return function TestComponent() {
    const { data } = useSuspenseQuery({
      queryKey: options.queryKey,
      queryFn: () => {
        options.fetchCount.count++
        return Promise.resolve('data')
      },
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
    vi.useRealTimers()
  })

  it('should enforce minimum staleTime of 1000ms when using suspense with number', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: ['test'],
      staleTime: 10,
    })

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    await act(() => vi.advanceTimersByTimeAsync(0))
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
      queryKey: ['test-func'],
      staleTime: () => 10,
    })

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    await act(() => vi.advanceTimersByTimeAsync(0))
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

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    await act(() => vi.advanceTimersByTimeAsync(0))
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

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    await act(() => vi.advanceTimersByTimeAsync(0))
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

  it('should respect staleTime when function returns value greater than 1000ms', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: queryKey(),
      staleTime: () => 3000,
    })

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    await act(() => vi.advanceTimersByTimeAsync(0))
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
