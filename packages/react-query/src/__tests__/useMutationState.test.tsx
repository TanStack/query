import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, useIsMutating, useMutation, useMutationState } from '..'
import { renderWithClient } from './utils'

describe('useIsMutating', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the number of fetching mutations', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const key1 = queryKey()
    const key2 = queryKey()

    function IsMutating() {
      const isMutating = useIsMutating()

      isMutatingArray.push(isMutating)

      return null
    }

    function Mutations() {
      const { mutate: mutate1 } = useMutation({
        mutationKey: key1,
        mutationFn: () => sleep(50).then(() => 'data'),
      })
      const { mutate: mutate2 } = useMutation({
        mutationKey: key2,
        mutationFn: () => sleep(10).then(() => 'data'),
      })

      return (
        <div>
          <button onClick={() => mutate1()}>mutate1</button>
          <button onClick={() => mutate2()}>mutate2</button>
        </div>
      )
    }

    function Page() {
      return (
        <div>
          <IsMutating />
          <Mutations />
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    await vi.advanceTimersByTimeAsync(10)
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))

    // we don't really care if this yields
    // [ +0, 1, 2, +0 ]
    // or
    // [ +0, 1, 2, 1, +0 ]
    // our batching strategy might yield different results

    await vi.advanceTimersByTimeAsync(41)
    expect(isMutatingArray[0]).toEqual(0)
    expect(isMutatingArray[1]).toEqual(1)
    expect(isMutatingArray[2]).toEqual(2)
    expect(isMutatingArray[3]).toEqual(1)
    expect(isMutatingArray[4]).toEqual(0)

    expect(isMutatingArray).toEqual([0, 1, 2, 1, 0])
  })

  it('should update when the query client is cleared', async () => {
    const queryClient = new QueryClient()

    function Page() {
      const { mutate } = useMutation({
        mutationFn: () => sleep(1000).then(() => 'data'),
      })
      const isMutating = useIsMutating()

      return (
        <div>
          <div>mutating: {isMutating}</div>
          <button onClick={() => mutate()}>mutate</button>
          <button onClick={() => queryClient.clear()}>clear</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    fireEvent.click(rendered.getByRole('button', { name: 'mutate' }))
    await vi.advanceTimersByTimeAsync(1)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: 'clear' }))
    await vi.advanceTimersByTimeAsync(1)
    expect(queryClient.isMutating()).toBe(0)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(1000)
  })

  it('should filter correctly by mutationKey', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const key1 = queryKey()
    const key2 = queryKey()

    function IsMutating() {
      const isMutating = useIsMutating({ mutationKey: key1 })
      isMutatingArray.push(isMutating)
      return null
    }

    function Page() {
      const { mutate: mutate1 } = useMutation({
        mutationKey: key1,
        mutationFn: () => sleep(100).then(() => 'data'),
      })
      const { mutate: mutate2 } = useMutation({
        mutationKey: key2,
        mutationFn: () => sleep(100).then(() => 'data'),
      })

      React.useEffect(() => {
        mutate1()
        mutate2()
      }, [mutate1, mutate2])

      return <IsMutating />
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(101)
    expect(isMutatingArray).toEqual([0, 1, 0])
  })

  it('should filter correctly by predicate', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()
    const key1 = queryKey()
    const key2 = queryKey()

    function IsMutating() {
      const isMutating = useIsMutating({
        predicate: (mutation) => mutation.options.mutationKey?.[0] === key1[0],
      })
      isMutatingArray.push(isMutating)
      return null
    }

    function Page() {
      const { mutate: mutate1 } = useMutation({
        mutationKey: key1,
        mutationFn: () => sleep(100).then(() => 'data'),
      })
      const { mutate: mutate2 } = useMutation({
        mutationKey: key2,
        mutationFn: () => sleep(100).then(() => 'data'),
      })

      React.useEffect(() => {
        mutate1()
        mutate2()
      }, [mutate1, mutate2])

      return <IsMutating />
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(101)
    expect(isMutatingArray).toEqual([0, 1, 0])
  })

  it('should use provided custom queryClient', async () => {
    const queryClient = new QueryClient()
    const key = queryKey()

    function Page() {
      const isMutating = useIsMutating({}, queryClient)
      const { mutate } = useMutation(
        {
          mutationKey: key,
          mutationFn: () => sleep(10).then(() => 'data'),
        },
        queryClient,
      )

      React.useEffect(() => {
        mutate()
      }, [mutate])

      return (
        <div>
          <div>mutating: {isMutating}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()
  })
})

describe('useMutationState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should remove successful mutations when the query client is cleared', async () => {
    const queryClient = new QueryClient()

    function Page() {
      const { mutate } = useMutation({
        mutationFn: () => Promise.resolve('saved'),
      })
      const data = useMutationState({
        filters: { status: 'success' },
        select: (mutation) => mutation.state.data,
      })

      return (
        <div>
          <div>data: {JSON.stringify(data)}</div>
          <button onClick={() => mutate()}>mutate</button>
          <button onClick={() => queryClient.clear()}>clear</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    fireEvent.click(rendered.getByRole('button', { name: 'mutate' }))
    await vi.advanceTimersByTimeAsync(1)
    expect(rendered.getByText('data: ["saved"]')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: 'clear' }))
    await vi.advanceTimersByTimeAsync(1)
    expect(queryClient.getMutationCache().getAll()).toEqual([])
    expect(rendered.getByText('data: []')).toBeInTheDocument()
  })

  it('should return variables after calling mutate', async () => {
    const queryClient = new QueryClient()
    const variables: Array<Array<unknown>> = []
    const mutationKey = ['mutation']

    function Variables() {
      variables.push(
        useMutationState({
          filters: { mutationKey, status: 'pending' },
          select: (mutation) => mutation.state.variables,
        }),
      )

      return null
    }

    function Mutate() {
      const { mutate, data } = useMutation({
        mutationKey,
        mutationFn: (input: number) => sleep(150).then(() => 'data' + input),
      })

      return (
        <div>
          data: {data ?? 'null'}
          <button onClick={() => mutate(1)}>mutate</button>
        </div>
      )
    }

    function Page() {
      return (
        <div>
          <Variables />
          <Mutate />
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    expect(rendered.getByText('data: null')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(151)
    expect(rendered.getByText('data: data1')).toBeInTheDocument()

    expect(variables).toEqual([[], [1], []])
  })
})
