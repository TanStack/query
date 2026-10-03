import { queryKey } from '@tanstack/query-test-utils'
import { fireEvent } from '@testing-library/preact'
import { useState } from 'preact/hooks'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { QueryCache, QueryClient, useQuery } from '..'
import { renderWithClient } from './utils'

describe('useQuery unsubscribed optimistic state', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ queryCache: new QueryCache() })
    vi.useFakeTimers()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should not show fetching on re-render when unsubscribed', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => Promise.resolve('data'))

    function Page() {
      const [subscribed, setSubscribed] = useState(true)
      const [other, setOther] = useState(false)
      const query = useQuery({
        queryKey: key,
        queryFn,
        subscribed,
      })

      return (
        <div>
          <span>isFetching: {String(query.isFetching)}</span>
          <span>fetchStatus: {query.fetchStatus}</span>
          <button onClick={() => setSubscribed(false)}>unsubscribe</button>
          <button onClick={() => setOther(!other)}>rerender</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(0)
    rendered.getByText('isFetching: false')
    rendered.getByText('fetchStatus: idle')

    fireEvent.click(rendered.getByRole('button', { name: 'unsubscribe' }))
    await vi.advanceTimersByTimeAsync(0)

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(
      queryClient.getQueryCache().find({ queryKey: key })!.observers.length,
    ).toBe(0)

    // re-render while unsubscribed
    fireEvent.click(rendered.getByRole('button', { name: 'rerender' }))
    await vi.advanceTimersByTimeAsync(0)

    rendered.getByText('isFetching: false')
    rendered.getByText('fetchStatus: idle')
  })

  it('should not show fetching when unsubscribed from the start', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => Promise.resolve('data'))

    function Page() {
      const query = useQuery({
        queryKey: key,
        queryFn,
        subscribed: false,
      })

      return (
        <div>
          <span>isFetching: {String(query.isFetching)}</span>
          <span>fetchStatus: {query.fetchStatus}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(0)

    expect(queryFn).toHaveBeenCalledTimes(0)
    rendered.getByText('isFetching: false')
    rendered.getByText('fetchStatus: idle')
  })
})
