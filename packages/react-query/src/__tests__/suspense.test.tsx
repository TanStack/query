import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import { Suspense } from 'react'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, useSuspenseQuery } from '..'
import { renderWithClientAndSuspense, rerenderWithSuspense } from './utils'
import type { StaleTime } from '@tanstack/query-core'
import type { QueryKey } from '..'

async function renderWithSuspense(client: QueryClient, ui: React.ReactNode) {
  return renderWithClientAndSuspense(
    client,
    <Suspense fallback="loading">{ui}</Suspense>,
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
    queryClient.clear()
  })

  it('should enforce minimum staleTime of 1000ms when using suspense with number', async () => {
    const TestComponent = createTestQuery({
      fetchCount,
      queryKey: ['test'],
      staleTime: 10,
    })

    const rendered = await renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    await rerenderWithSuspense(
      rendered,
      <Suspense fallback="loading">
        <TestComponent />
      </Suspense>,
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

    const rendered = await renderWithSuspense(queryClient, <TestComponent />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    await rerenderWithSuspense(
      rendered,
      <Suspense fallback="loading">
        <TestComponent />
      </Suspense>,
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

    await rerenderWithSuspense(
      rendered,
      <Suspense fallback="loading">
        <TestComponent />
      </Suspense>,
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

    await rerenderWithSuspense(
      rendered,
      <Suspense fallback="loading">
        <TestComponent />
      </Suspense>,
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

    await rerenderWithSuspense(
      rendered,
      <Suspense fallback="loading">
        <TestComponent />
      </Suspense>,
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

    await rerenderWithSuspense(
      rendered,
      <Suspense fallback="loading">
        <TestComponent />
      </Suspense>,
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

    await rerenderWithSuspense(
      rendered,
      <Suspense fallback="loading">
        <TestComponent />
      </Suspense>,
    )

    await act(() => vi.advanceTimersByTimeAsync(2000))

    expect(fetchCount.count).toBe(1)
  })
})
