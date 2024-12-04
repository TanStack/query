import { act, render, waitFor } from '@testing-library/react'
import { Suspense } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { QueryClient, QueryClientProvider, useSuspenseQuery } from '..'
import { queryKey, renderWithClient, sleep } from './utils'

describe('Suspense Timer Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  it('should enforce minimum staleTime of 1000ms when using suspense with number', async () => {
    const shortStaleTime = 10
    let fetchCount = 0

    function TestComponent() {
      const { data } = useSuspenseQuery({
        queryKey: ['test'],
        queryFn: () => {
          fetchCount++
          return 'data'
        },
        staleTime: shortStaleTime,
      })
      return <div>{data}</div>
    }

    const wrapper = render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(wrapper.getByText('data')).toBeInTheDocument()
    })

    wrapper.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(fetchCount).toBe(1)
  })

  it('should enforce minimum staleTime of 1000ms when using suspense with function', async () => {
    let fetchCount = 0
    const staleTimeFunc = () => 10

    function TestComponent() {
      const { data } = useSuspenseQuery({
        queryKey: ['test-func'],
        queryFn: () => {
          fetchCount++
          return 'data'
        },
        staleTime: staleTimeFunc,
      })
      return <div>{data}</div>
    }

    const wrapper = render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(wrapper.getByText('data')).toBeInTheDocument()
    })

    wrapper.rerender(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <TestComponent />
        </Suspense>
      </QueryClientProvider>,
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(fetchCount).toBe(1)
  })

  it('should respect staleTime when value is greater than 1000ms', async () => {
    const key = queryKey()
    const staleTime = 2000
    let fetchCount = 0

    function Component() {
      const result = useSuspenseQuery({
        queryKey: key,
        queryFn: async () => {
          fetchCount++
          await sleep(10)
          return 'data'
        },
        staleTime,
      })
      return <div>data: {result.data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <Suspense fallback="loading">
        <Component />
      </Suspense>,
    )

    await waitFor(() => rendered.getByText('data: data'))

    // Manually trigger a remount
    rendered.rerender(
      <Suspense fallback="loading">
        <Component />
      </Suspense>,
    )

    // Wait longer than 1000ms but less than staleTime
    await act(async () => {
      await sleep(1500)
    })

    // Should not refetch as we're still within the staleTime
    expect(fetchCount).toBe(1)
  })

  it('should enforce minimum staleTime when undefined is provided', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Component() {
      const result = useSuspenseQuery({
        queryKey: key,
        queryFn: async () => {
          fetchCount++
          await sleep(10)
          return 'data'
        },
        // Explicitly set staleTime as undefined
        staleTime: undefined,
      })
      return <div>data: {result.data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <Suspense fallback="loading">
        <Component />
      </Suspense>,
    )

    await waitFor(() => rendered.getByText('data: data'))

    rendered.rerender(
      <Suspense fallback="loading">
        <Component />
      </Suspense>,
    )

    // Wait less than enforced 1000ms
    await act(async () => {
      await sleep(500)
    })

    // Should not refetch as minimum staleTime of 1000ms is enforced
    expect(fetchCount).toBe(1)
  })

  it('should respect staleTime when function returns value greater than 1000ms', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Component() {
      const result = useSuspenseQuery({
        queryKey: key,
        queryFn: async () => {
          fetchCount++
          await sleep(10)
          return 'data'
        },
        staleTime: () => 3000,
      })
      return <div>data: {result.data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <Suspense fallback="loading">
        <Component />
      </Suspense>,
    )

    await waitFor(() => rendered.getByText('data: data'))

    rendered.rerender(
      <Suspense fallback="loading">
        <Component />
      </Suspense>,
    )

    // Wait longer than 1000ms but less than returned staleTime
    await act(async () => {
      await sleep(2000)
    })

    // Should not refetch as we're still within the returned staleTime
    expect(fetchCount).toBe(1)
  })
})
