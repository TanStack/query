import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act, fireEvent } from '@testing-library/react'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { Suspense, startTransition, useDeferredValue } from 'react'
import { QueryClient, useQuery, useSuspenseQuery } from '..'
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

  it('keeps the committed observer result when a render for another key suspends', async () => {
    const key = queryKey()
    queryClient.setQueryData([key, 1], { value: 1 })
    queryClient.setQueryData([key, 2], { value: 2 })
    const pending = new Promise<void>(() => {})
    const renderB = vi.fn()
    const select = (data: { value: number }) => ({ selected: data.value })

    function Page() {
      const [id, setId] = React.useState(1)
      const { data } = useQuery({
        queryKey: [key, id],
        queryFn: () => Promise.resolve({ value: id }),
        staleTime: Infinity,
        select,
      })
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
      <Suspense fallback="loading">
        <Page />
      </Suspense>,
    )
    const queryA = queryClient.getQueryCache().find({ queryKey: [key, 1] })!
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
      queryClient.setQueryData([key, 1], { value: 3 })
      await vi.advanceTimersByTimeAsync(0)
    })
    rendered.getByText('data: 3')
    expect(observer.getCurrentResult().data).toEqual({ selected: 3 })
    expect(
      queryClient.getQueryCache().find({ queryKey: [key, 2] })!.observers,
    ).toEqual([])
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
