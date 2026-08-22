import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  keepPreviousData,
  skipToken,
  useSuspenseInfiniteQuery,
} from '..'
import { renderWithSuspense } from './utils'
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
    queryClient.clear()
    vi.useRealTimers()
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

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({
      data: { pages: [1], pageParams: [1] },
      status: 'success',
    })

    await act(async () => {
      fireEvent.click(rendered.getByText('next'))
    })
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    expect(states.length).toBe(2)
    expect(states[1]).toMatchObject({
      data: { pages: [2], pageParams: [1] },
      status: 'success',
    })
  })

  it('should log an error when skipToken is passed as queryFn', async () => {
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

    await renderWithSuspense(queryClient, <App />)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseInfiniteQuery',
    )
    consoleErrorSpy.mockRestore()
  })

  it('should log an error when skipToken is used in development environment', async () => {
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

    await renderWithSuspense(queryClient, <Page />)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseInfiniteQuery',
    )

    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = envCopy
  })

  it('should not log an error when skipToken is used in production environment', async () => {
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

    await renderWithSuspense(queryClient, <Page />)

    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = envCopy
  })

  it('should use static placeholderData without suspending', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 1))
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

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(rendered.getByText('data: 0')).toBeInTheDocument()
    expect(states.at(-1)?.isPlaceholderData).toBe(true)
    expect(queryFn).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(11))

    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(states.at(-1)?.isPlaceholderData).toBe(false)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should use keepPreviousData from queryClient defaults', async () => {
    const key = queryKey()
    const queryClientWithPlaceholder = new QueryClient({
      defaultOptions: {
        queries: {
          placeholderData: keepPreviousData,
        },
      },
    })
    const states: Array<UseSuspenseInfiniteQueryResult<InfiniteData<number>>> =
      []

    let count = 0

    function Page() {
      const [stateKey, setStateKey] = React.useState(key)

      const state = useSuspenseInfiniteQuery({
        queryKey: stateKey,
        queryFn: () => sleep(10).then(() => ++count),
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      })

      states.push(state)

      return (
        <div>
          <button aria-label="toggle" onClick={() => setStateKey(queryKey())} />
          data: {String(state.data?.pages.join(','))}
        </div>
      )
    }

    const rendered = await renderWithSuspense(
      queryClientWithPlaceholder,
      <Page />,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(rendered.getByLabelText('toggle'))
    })
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(states.at(-1)).toMatchObject({
      data: { pages: [1], pageParams: [1] },
      isPlaceholderData: true,
      isFetching: true,
    })
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: 2')).toBeInTheDocument()
    expect(states.at(-1)).toMatchObject({
      data: { pages: [2], pageParams: [1] },
      isPlaceholderData: false,
      isFetching: false,
    })
  })

  it('should start a keepPreviousData fetch during a transition', async () => {
    const key = queryKey()
    const queryFn = vi.fn((count: number) => sleep(10).then(() => count))

    function Page() {
      const [count, setCount] = React.useState(0)
      const state = useSuspenseInfiniteQuery({
        queryKey: [...key, count],
        queryFn: () => queryFn(count),
        initialPageParam: 1,
        getNextPageParam: () => undefined,
        placeholderData: keepPreviousData,
      })

      return (
        <div>
          <button
            onClick={() =>
              React.startTransition(() => setCount((value) => value + 1))
            }
          >
            next
          </button>
          <div>data: {state.data.pages.join(',')}</div>
          <div>placeholder: {String(state.isPlaceholderData)}</div>
        </div>
      )
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 0')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(rendered.getByText('next'))
    })

    expect(rendered.getByText('data: 0')).toBeInTheDocument()
    expect(rendered.getByText('placeholder: true')).toBeInTheDocument()
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(2)

    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(rendered.getByText('placeholder: false')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(2)
  })
})
