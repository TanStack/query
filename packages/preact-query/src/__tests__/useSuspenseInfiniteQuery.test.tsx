import { createKey, sleep } from '@tanstack/query-test-utils'
import { act } from '@testing-library/preact'
import { Suspense } from 'preact/compat'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryCache,
  QueryClient,
  skipToken,
  useSuspenseInfiniteQuery,
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
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should use static placeholderData without suspending', async () => {
    vi.useFakeTimers()
    const key = createKey()
    const queryFn = vi.fn<() => Promise<number>>(() => sleep(10).then(() => 1))
    const states: Array<UseSuspenseInfiniteQueryResult<InfiniteData<number>>> =
      []

    function Page() {
      const state = useSuspenseInfiniteQuery({
        queryKey: key,
        queryFn,
        initialPageParam: 1,
        getNextPageParam: () => undefined,
        placeholderData: { pages: [0], pageParams: [1] },
      })

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

  it('should log an error when skipToken is passed as queryFn', () => {
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const key = createKey()

    function Page() {
      useSuspenseInfiniteQuery({
        queryKey: key,
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error
        queryFn: Math.random() >= 0 ? skipToken : () => Promise.resolve(5),
      })

      return null
    }

    function App() {
      return (
        <Suspense fallback="Loading...">
          <Page />
        </Suspense>
      )
    }

    renderWithClient(queryClient, <App />)

    expect(consoleErrorMock).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseInfiniteQuery',
    )
  })

  it('should log an error when skipToken is used in development environment', () => {
    const envCopy = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockReturnValue(undefined)
    const key = createKey()

    function Page() {
      useSuspenseInfiniteQuery({
        queryKey: key,
        queryFn: skipToken as any,
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      return null
    }

    renderWithClient(
      queryClient,
      <Suspense fallback="Loading...">
        <Page />
      </Suspense>,
    )

    expect(consoleErrorMock).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseInfiniteQuery',
    )

    process.env.NODE_ENV = envCopy
  })

  it('should not log an error when skipToken is used in production environment', () => {
    const envCopy = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockReturnValue(undefined)
    const key = createKey()

    function Page() {
      useSuspenseInfiniteQuery({
        queryKey: key,
        queryFn: skipToken as any,
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      return null
    }

    renderWithClient(
      queryClient,
      <Suspense fallback="Loading...">
        <Page />
      </Suspense>,
    )

    expect(consoleErrorMock).not.toHaveBeenCalled()

    process.env.NODE_ENV = envCopy
  })
})
