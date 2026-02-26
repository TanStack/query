import { queryKey, sleep } from '@tanstack/query-test-utils'
import { render } from '@testing-library/preact'
import type { ComponentChildren } from 'preact'
import { Suspense } from 'preact/compat'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { QueryClient, QueryClientProvider, useSuspenseQuery } from '..'
import type { StaleTime } from '@tanstack/query-core'
import type { QueryKey } from '..'

function renderWithSuspense(client: QueryClient, ui: ComponentChildren) {
  return render(
    <QueryClientProvider client={client}>
      <Suspense fallback="loading">{ui}</Suspense>
    </QueryClientProvider>,
  )
}

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
    vi.useRealTimers()
  })

  it('should enforce minimum staleTime of 1000ms when using suspense with number', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: ['test'],
      staleTime: 10,
    })

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(10)

    expect(fetchCount.count).toBe(1)
  })

  it('should enforce minimum staleTime of 1000ms when using suspense with function', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: ['test-func'],
      staleTime: () => 10,
    })

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(10)

    expect(fetchCount.count).toBe(1)
  })

  it('should respect staleTime when value is greater than 1000ms', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: queryKey(),
      staleTime: 2000,
    })

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(1500)

    expect(fetchCount.count).toBe(1)
  })

  it('should enforce minimum staleTime when undefined is provided', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: queryKey(),
      staleTime: undefined,
    })

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(500)

    expect(fetchCount.count).toBe(1)
  })

  it('should preserve staleTime when value is static', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: queryKey(),
      staleTime: 'static',
    })

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(2000)

    expect(fetchCount.count).toBe(1)
  })

  it('should preserve staleTime when function returns static', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: queryKey(),
      staleTime: () => 'static',
    })

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(2000)

    expect(fetchCount.count).toBe(1)
  })

  it('should respect staleTime when function returns value greater than 1000ms', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: queryKey(),
      staleTime: () => 3000,
    })

    const rendered = renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(2000)

    expect(fetchCount.count).toBe(1)
  })
})
