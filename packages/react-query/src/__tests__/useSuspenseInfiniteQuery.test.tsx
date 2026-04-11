import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { queryKey, sleep } from '@tanstack/query-test-utils'
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
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
  })

  afterEach(() => {
    vi.useRealTimers()
    queryClient.clear()
  })

  it('should return the correct states for a successful infinite query', async () => {
    const key = queryKey()
    const states: Array<UseSuspenseInfiniteQueryResult<InfiniteData<number>>> =
      []

    function Page() {
      const [multiplier, setMultiplier] = React.useState(1)
      const state = useSuspenseInfiniteQuery({
        queryKey: [`${key}_${multiplier}`],
        queryFn: ({ pageParam }) =>
          sleep(10).then(() => pageParam * multiplier),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage + 1,
      })

      states.push(state)

      return (
        <div>
          <button onClick={() => setMultiplier(2)}>next</button>
          data: {state.data?.pages.join(',')}
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({
      data: { pages: [1], pageParams: [1] },
      status: 'success',
    })

    fireEvent.click(rendered.getByText('next'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    expect(states.length).toBe(2)
    expect(states[1]).toMatchObject({
      data: { pages: [2], pageParams: [1] },
      status: 'success',
    })
  })

  it('should log an error when skipToken is passed as queryFn', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const key = queryKey()

    function Page() {
      useSuspenseInfiniteQuery({
        queryKey: key,
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error
        // eslint-disable-next-line react-hooks/purity
        queryFn: Math.random() >= 0 ? skipToken : () => Promise.resolve(5),
      })

      return null
    }

    function App() {
      return (
        <React.Suspense fallback="Loading...">
          <Page />
        </React.Suspense>
      )
    }

    renderWithClient(queryClient, <App />)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseInfiniteQuery',
    )
    consoleErrorSpy.mockRestore()
  })

  it('should log an error when skipToken is used in development environment', () => {
    const envCopy = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

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
      <React.Suspense fallback="Loading...">
        <Page />
      </React.Suspense>,
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseInfiniteQuery',
    )

    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = envCopy
  })

  it('should not log an error when skipToken is used in production environment', () => {
    const envCopy = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

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
      <React.Suspense fallback="Loading...">
        <Page />
      </React.Suspense>,
    )

    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = envCopy
  })
})
