import { createKey, sleep } from '@tanstack/query-test-utils'
import { act, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('should render without fetching until skipToken is replaced by a query function', async () => {
    const key = createKey()
    const queryFn = vi.fn<() => Promise<string>>(() =>
      sleep(10).then(() => 'fetched'),
    )

    function Page() {
      const [ready, setReady] = React.useState(false)
      const result = useSuspenseInfiniteQuery({
        queryKey: key,
        queryFn: ready ? queryFn : skipToken,
        initialPageParam: 0,
        getNextPageParam: () => undefined,
      })

      return (
        <>
          <button onClick={() => setReady(true)}>start</button>
          <div>
            {result.data?.pages[0] ?? `${result.status}/${result.fetchStatus}`}
          </div>
        </>
      )
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('pending/idle')).toBeInTheDocument()
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(queryFn).not.toHaveBeenCalled()

    await act(() => {
      fireEvent.click(rendered.getByRole('button', { name: 'start' }))
    })

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('fetched')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should return the correct states for a successful infinite query', async () => {
    const key = createKey()
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

    expect(states).toHaveLength(1)
    expect(states[0]).toMatchObject({
      data: { pages: [1], pageParams: [1] },
      status: 'success',
    })

    await act(() => {
      fireEvent.click(rendered.getByText('next'))
    })
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    expect(states).toHaveLength(2)
    expect(states[1]).toMatchObject({
      data: { pages: [2], pageParams: [1] },
      status: 'success',
    })
  })

  it('should use static placeholderData without suspending', async () => {
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
    const key = createKey()
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
          <button
            aria-label="toggle"
            onClick={() => setStateKey(createKey())}
          />
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

    await act(() => {
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
    const key = createKey()
    const queryFn = vi.fn<(count: number) => Promise<number>>((count: number) =>
      sleep(10).then(() => count),
    )

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

    await act(() => {
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
