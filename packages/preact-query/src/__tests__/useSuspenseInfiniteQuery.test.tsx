import { clearQueryClient, placeholderData } from '@tanstack/query-core'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { act, fireEvent } from '@testing-library/preact'
import { Suspense } from 'preact/compat'
import { useState } from 'preact/hooks'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryCache,
  QueryClient,
  skipToken,
  suspenseInfiniteQueryOptions,
  useQuery,
} from '..'
import { renderWithClient } from './utils'
import type { InfiniteData, UseSuspenseInfiniteQueryResult } from '..'

describe('useSuspenseInfiniteQuery', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeEach(() => {
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
  })

  afterEach(() => {
    clearQueryClient(queryClient)
    vi.useRealTimers()
  })

  it('should render without fetching until skipToken is replaced by a query function', async () => {
    vi.useFakeTimers()
    const key = createKey()
    const queryFn = vi.fn<() => Promise<string>>(() =>
      sleep(10).then(() => 'fetched'),
    )

    function Page() {
      const [ready, setReady] = useState(false)
      const result = useQuery(
        suspenseInfiniteQueryOptions({
          queryKey: key,
          queryFn: ready ? queryFn : skipToken,
          initialPageParam: 0,
          getNextPageParam: () => undefined,
        }),
      )

      return (
        <>
          <button onClick={() => setReady(true)}>start</button>
          <div>
            {result.data?.pages[0] ?? `${result.status}/${result.fetchStatus}`}
          </div>
        </>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <Suspense fallback="loading">
        <Page />
      </Suspense>,
    )

    expect(rendered.getByText('pending/idle')).toBeInTheDocument()
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(queryFn).not.toHaveBeenCalled()

    await act(() => {
      fireEvent.click(rendered.getByRole('button', { name: 'start' }))
    })

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(rendered.getByText('fetched')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should use static placeholderData without suspending', async () => {
    vi.useFakeTimers()
    const key = createKey()
    const queryFn = vi.fn<() => Promise<number>>(() => sleep(10).then(() => 1))
    const states: Array<UseSuspenseInfiniteQueryResult<InfiniteData<number>>> =
      []

    function Page() {
      const state = useQuery(
        suspenseInfiniteQueryOptions({
          queryKey: key,
          queryFn,
          initialPageParam: 1,
          getNextPageParam: () => undefined,
          placeholderData: placeholderData({ pages: [0], pageParams: [1] }),
        }),
      )

      states.push(state)
      return <div>data: {state.data.pages.join(',')}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <Suspense fallback="loading">
        <Page />
      </Suspense>,
    )

    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(rendered.getByText('data: 0')).toBeInTheDocument()
    expect(states.at(-1)?.isPlaceholderData).toBe(true)
    expect(queryFn).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(states.at(-1)?.isPlaceholderData).toBe(false)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})
