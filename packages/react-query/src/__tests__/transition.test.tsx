import {
  clearQueryClient,
  findCachedQuery,
  getQueryCache,
  setQueryData,
} from '@tanstack/query-core'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { act, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { startTransition, useDeferredValue } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryClient,
  keepPreviousData,
  queryOptions,
  suspenseQueryOptions,
  useQuery,
} from '..'
import { optionalPlaceholderData, optionalSelect } from './helpers/projection'
import { renderWithClient, renderWithSuspense } from './utils'

describe('react transitions', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    clearQueryClient(queryClient)
    vi.useRealTimers()
  })

  it('keeps the committed observer result when a render for another key suspends', async () => {
    const key = createKey()
    setQueryData(queryClient, [key, 1], { value: 1 })
    setQueryData(queryClient, [key, 2], { value: 2 })
    const pending = new Promise<void>(() => {})
    const renderB = vi.fn<(data: { selected: number } | undefined) => void>()
    const select = (data: { value: number }) => ({ selected: data.value })

    function Page() {
      const [id, setId] = React.useState(1)
      const { data } = useQuery(
        queryOptions({
          queryKey: [key, id],
          queryFn: () => Promise.resolve({ value: id }),
          staleTime: Infinity,
          select: optionalSelect(select),
        }),
      )
      if (id === 2) {
        renderB(data)
        throw pending
      }
      return (
        <>
          <button onClick={() => startTransition(() => setId(2))}>
            switch
          </button>
          <div>data: {data?.selected}</div>
        </>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )
    const queryA = findCachedQuery(getQueryCache(queryClient), {
      queryKey: [key, 1],
    })!
    const observer = queryA.observers[0]!
    const committed = observer.getCurrentResult()
    await act(() =>
      fireEvent.click(rendered.getByRole('button', { name: 'switch' })),
    )
    expect(renderB).toHaveBeenCalledWith({ selected: 2 })
    expect(observer.getCurrentResult()).toBe(committed)
    expect(observer.getCurrentQuery()).toBe(queryA)
    rendered.getByText('data: 1')

    await act(async () => {
      setQueryData(queryClient, [key, 1], { value: 3 })
      await vi.advanceTimersByTimeAsync(0)
    })
    rendered.getByText('data: 3')
    expect(observer.getCurrentResult().data).toStrictEqual({ selected: 3 })
    expect(
      findCachedQuery(getQueryCache(queryClient), { queryKey: [key, 2] })!
        .observers,
    ).toStrictEqual([])
  })

  it('should keep values of old key around with useDeferredValue', async () => {
    const key = createKey()

    function Page() {
      const [count, setCount] = React.useState(0)
      const deferredCount = useDeferredValue(count)
      const query = useQuery(
        suspenseQueryOptions({
          queryKey: [key, deferredCount],
          queryFn: () => sleep(10).then(() => 'test' + deferredCount),
        }),
      )

      return (
        <div>
          <button onClick={() => setCount((c) => c + 1)}>increment</button>
          <div>data: {query.data}</div>
        </div>
      )
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

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

  it('should keep values of old key around with startTransition', async () => {
    const key = createKey()

    function Page() {
      const [count, setCount] = React.useState(0)
      const query = useQuery(
        suspenseQueryOptions({
          queryKey: [key, count],
          queryFn: () => sleep(10).then(() => 'test' + count),
        }),
      )

      return (
        <div>
          <button onClick={() => startTransition(() => setCount((c) => c + 1))}>
            increment
          </button>
          <div>data: {query.data}</div>
        </div>
      )
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

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

  it.each([
    ['startTransition', 'static'],
    ['startTransition', 'keepPreviousData'],
    ['useDeferredValue', 'static'],
    ['useDeferredValue', 'keepPreviousData'],
  ] as const)(
    'should use %s with %s placeholderData',
    async (transition, placeholderMode) => {
      const key = createKey()
      const queryFn = vi.fn<(count: number) => Promise<string>>(
        (count: number) => sleep(10).then(() => `test${count}`),
      )

      function Page() {
        const [count, setCount] = React.useState(0)
        const deferredCount = useDeferredValue(count)
        const queryCount =
          transition === 'useDeferredValue' ? deferredCount : count
        const query = useQuery(
          suspenseQueryOptions({
            queryKey: [key, queryCount],
            queryFn: () => queryFn(queryCount),
            placeholderData: optionalPlaceholderData(
              placeholderMode === 'static' ? 'placeholder' : keepPreviousData,
            ),
          }),
        )

        return (
          <div>
            <button
              onClick={() => {
                if (transition === 'startTransition') {
                  startTransition(() => setCount((value) => value + 1))
                } else {
                  setCount((value) => value + 1)
                }
              }}
            >
              increment
            </button>
            <div>data: {query.data}</div>
            <div>placeholder: {String(query.isPlaceholderData)}</div>
          </div>
        )
      }

      const rendered = await renderWithSuspense(queryClient, <Page />)

      expect(
        rendered.getByText(
          placeholderMode === 'static' ? 'data: placeholder' : 'loading',
        ),
      ).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data: test0')).toBeInTheDocument()
      expect(rendered.getByText('placeholder: false')).toBeInTheDocument()

      await act(() =>
        fireEvent.click(rendered.getByRole('button', { name: 'increment' })),
      )

      expect(rendered.queryByText('loading')).not.toBeInTheDocument()
      expect(
        rendered.getByText(
          placeholderMode === 'static' ? 'data: placeholder' : 'data: test0',
        ),
      ).toBeInTheDocument()
      expect(rendered.getByText('placeholder: true')).toBeInTheDocument()
      expect(queryFn).toHaveBeenCalledTimes(2)

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data: test1')).toBeInTheDocument()
      expect(rendered.getByText('placeholder: false')).toBeInTheDocument()
      expect(queryFn).toHaveBeenCalledTimes(2)
    },
  )

  it.each([
    ['startTransition', 'static'],
    ['startTransition', 'keepPreviousData'],
    ['useDeferredValue', 'static'],
    ['useDeferredValue', 'keepPreviousData'],
  ] as const)(
    'should start a %s placeholder query with %s before a sibling suspends',
    async (transition, placeholderMode) => {
      const key = createKey()
      const placeholderQueryFn = vi.fn<(count: number) => Promise<string>>(
        (count: number) => sleep(10).then(() => `placeholder-query-${count}`),
      )
      const suspenseQueryFn = vi.fn<(count: number) => Promise<string>>(
        (count: number) => sleep(10).then(() => `suspense-query-${count}`),
      )

      function PlaceholderQuery({ count }: { count: number }) {
        const query = useQuery(
          suspenseQueryOptions({
            queryKey: [...key, 'placeholder', count],
            queryFn: () => placeholderQueryFn(count),
            placeholderData: optionalPlaceholderData(
              placeholderMode === 'static' ? 'placeholder' : keepPreviousData,
            ),
          }),
        )
        return <div>{query.data}</div>
      }

      function SuspenseQuery({ count }: { count: number }) {
        const query = useQuery(
          suspenseQueryOptions({
            queryKey: [...key, 'suspense', count],
            queryFn: () => suspenseQueryFn(count),
          }),
        )
        return <div>{query.data}</div>
      }

      function Page() {
        const [count, setCount] = React.useState(0)
        const deferredCount = useDeferredValue(count)
        const queryCount =
          transition === 'useDeferredValue' ? deferredCount : count

        return (
          <>
            <button
              onClick={() => {
                if (transition === 'startTransition') {
                  startTransition(() => setCount((value) => value + 1))
                } else {
                  setCount((value) => value + 1)
                }
              }}
            >
              increment
            </button>
            <React.Suspense fallback="placeholder loading">
              <PlaceholderQuery count={queryCount} />
            </React.Suspense>
            <React.Suspense fallback="suspense loading">
              <SuspenseQuery count={queryCount} />
            </React.Suspense>
          </>
        )
      }

      const rendered = await renderWithSuspense(queryClient, <Page />)

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('placeholder-query-0')).toBeInTheDocument()
      expect(rendered.getByText('suspense-query-0')).toBeInTheDocument()

      await act(() =>
        fireEvent.click(rendered.getByRole('button', { name: 'increment' })),
      )

      expect(rendered.getByText('placeholder-query-0')).toBeInTheDocument()
      expect(rendered.getByText('suspense-query-0')).toBeInTheDocument()
      expect(placeholderQueryFn).toHaveBeenCalledTimes(2)
      expect(suspenseQueryFn).toHaveBeenCalledTimes(2)

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('placeholder-query-1')).toBeInTheDocument()
      expect(rendered.getByText('suspense-query-1')).toBeInTheDocument()
      expect(placeholderQueryFn).toHaveBeenCalledTimes(2)
    },
  )

  it('should fetch a placeholder query for an abandoned transition', async () => {
    const key = createKey()
    const placeholderQueryFn = vi.fn<(count: number) => Promise<string>>(
      (count: number) => sleep(10).then(() => `placeholder-query-${count}`),
    )
    const suspenseQueryFn = vi.fn<(count: number) => Promise<string>>(
      (count: number) => sleep(10).then(() => `suspense-query-${count}`),
    )

    setQueryData(queryClient, [...key, 'placeholder', 0], 'placeholder-query-0')
    setQueryData(queryClient, [...key, 'suspense', 0], 'suspense-query-0')

    function Page({ hide }: { hide: () => void }) {
      const [count, setCount] = React.useState(0)
      const placeholderQuery = useQuery(
        suspenseQueryOptions({
          queryKey: [...key, 'placeholder', count],
          queryFn: () => placeholderQueryFn(count),
          placeholderData: optionalPlaceholderData(keepPreviousData),
        }),
      )
      const suspenseQuery = useQuery(
        suspenseQueryOptions({
          queryKey: [...key, 'suspense', count],
          queryFn: () => suspenseQueryFn(count),
        }),
      )

      return (
        <>
          <button
            onClick={() =>
              startTransition(() => setCount((value) => value + 1))
            }
          >
            increment
          </button>
          <button onClick={hide}>hide</button>
          <div>{placeholderQuery.data}</div>
          <div>{suspenseQuery.data}</div>
        </>
      )
    }

    function App() {
      const [show, setShow] = React.useState(true)
      return show ? <Page hide={() => setShow(false)} /> : <div>hidden</div>
    }

    const rendered = await renderWithSuspense(queryClient, <App />)

    expect(rendered.getByText('placeholder-query-0')).toBeInTheDocument()
    expect(rendered.getByText('suspense-query-0')).toBeInTheDocument()

    await act(() =>
      fireEvent.click(rendered.getByRole('button', { name: 'increment' })),
    )
    expect(placeholderQueryFn).toHaveBeenCalledWith(1)
    expect(suspenseQueryFn).toHaveBeenCalledWith(1)

    await act(() =>
      fireEvent.click(rendered.getByRole('button', { name: 'hide' })),
    )
    expect(rendered.getByText('hidden')).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(placeholderQueryFn).toHaveBeenCalledWith(1)
  })
})
