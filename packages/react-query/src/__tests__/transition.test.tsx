import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act, fireEvent } from '@testing-library/react'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { startTransition, useDeferredValue } from 'react'
import { QueryClient, keepPreviousData, useSuspenseQuery } from '..'
import { renderWithSuspense } from './utils'

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
      const key = queryKey()
      const queryFn = vi.fn((count: number) =>
        sleep(10).then(() => `test${count}`),
      )

      function Page() {
        const [count, setCount] = React.useState(0)
        const deferredCount = useDeferredValue(count)
        const queryCount =
          transition === 'useDeferredValue' ? deferredCount : count
        const query = useSuspenseQuery({
          queryKey: [key, queryCount],
          queryFn: () => queryFn(queryCount),
          placeholderData:
            placeholderMode === 'static' ? 'placeholder' : keepPreviousData,
        })

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
      const key = queryKey()
      const placeholderQueryFn = vi.fn((count: number) =>
        sleep(10).then(() => `placeholder-query-${count}`),
      )
      const suspenseQueryFn = vi.fn((count: number) =>
        sleep(10).then(() => `suspense-query-${count}`),
      )

      function PlaceholderQuery({ count }: { count: number }) {
        const query = useSuspenseQuery({
          queryKey: [...key, 'placeholder', count],
          queryFn: () => placeholderQueryFn(count),
          placeholderData:
            placeholderMode === 'static' ? 'placeholder' : keepPreviousData,
        })
        return <div>{query.data}</div>
      }

      function SuspenseQuery({ count }: { count: number }) {
        const query = useSuspenseQuery({
          queryKey: [...key, 'suspense', count],
          queryFn: () => suspenseQueryFn(count),
        })
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
    const key = queryKey()
    const placeholderQueryFn = vi.fn((count: number) =>
      sleep(10).then(() => `placeholder-query-${count}`),
    )
    const suspenseQueryFn = vi.fn((count: number) =>
      sleep(10).then(() => `suspense-query-${count}`),
    )

    queryClient.setQueryData([...key, 'placeholder', 0], 'placeholder-query-0')
    queryClient.setQueryData([...key, 'suspense', 0], 'suspense-query-0')

    function Page({ hide }: { hide: () => void }) {
      const [count, setCount] = React.useState(0)
      const placeholderQuery = useSuspenseQuery({
        queryKey: [...key, 'placeholder', count],
        queryFn: () => placeholderQueryFn(count),
        placeholderData: keepPreviousData,
      })
      const suspenseQuery = useSuspenseQuery({
        queryKey: [...key, 'suspense', count],
        queryFn: () => suspenseQueryFn(count),
      })

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
