import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act, fireEvent } from '@testing-library/react'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { Suspense, startTransition, useDeferredValue } from 'react'
import { QueryClient, useSuspenseQuery } from '..'
import { renderWithClient } from './utils'

describe('react transitions', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should keep values of old key around with useDeferredValue', async () => {
    const key = queryKey()

    function Page() {
      const [count, setCount] = React.useState(0)
      const deferredCount = useDeferredValue(count)
      const query = useSuspenseQuery({
        queryKey: [key, deferredCount],
        queryFn: () => sleep(10).then(() => 'test' + deferredCount),
      })

      return (
        <div>
          <button onClick={() => setCount((c) => c + 1)}>increment</button>
          <div>data: {query.data}</div>
        </div>
      )
    }

    const rendered = await renderWithClient(
      queryClient,
      <Suspense fallback="loading">
        <Page />
      </Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(10))

    expect(rendered.getByText('data: test0')).toBeInTheDocument()

    await act(() =>
      fireEvent.click(rendered.getByRole('button', { name: 'increment' })),
    )

    // the deferred key is still the old one, so the old data stays on screen
    // while the new query is in flight. `toBeVisible` matters here: on a
    // fallback React keeps the old subtree mounted but hides it with
    // `display: none`, so `toBeInTheDocument` would also pass.
    expect(rendered.getByText('data: test0')).toBeVisible()
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(10))

    expect(rendered.getByText('data: test1')).toBeInTheDocument()
  })

  it('should keep values of old key around with startTransition', async () => {
    const key = queryKey()

    function Page() {
      const [count, setCount] = React.useState(0)
      const query = useSuspenseQuery({
        queryKey: [key, count],
        queryFn: () => sleep(10).then(() => 'test' + count),
      })

      return (
        <div>
          <button onClick={() => startTransition(() => setCount((c) => c + 1))}>
            increment
          </button>
          <div>data: {query.data}</div>
        </div>
      )
    }

    const rendered = await renderWithClient(
      queryClient,
      <Suspense fallback="loading">
        <Page />
      </Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(10))

    expect(rendered.getByText('data: test0')).toBeInTheDocument()

    await act(() =>
      fireEvent.click(rendered.getByRole('button', { name: 'increment' })),
    )

    expect(rendered.getByText('data: test0')).toBeVisible()
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(10))

    expect(rendered.getByText('data: test1')).toBeInTheDocument()
  })
})
