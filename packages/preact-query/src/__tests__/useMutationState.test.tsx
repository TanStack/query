import { sleep } from '@tanstack/query-test-utils'
import { fireEvent, render } from '@testing-library/preact'
import { useEffect } from 'preact/hooks'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

    function IsMutating() {
      const isMutating = useIsMutating()

      isMutatingArray.push(isMutating)

      return null
    }

    function Mutations() {
      const { mutate: mutate1 } = useMutation({
        mutationKey: ['mutation1'],
        mutationFn: () => sleep(50).then(() => 'data'),
      })
      const { mutate: mutate2 } = useMutation({
        mutationKey: ['mutation2'],
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

  it('should filter correctly by mutationKey', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()

    function IsMutating() {
      const isMutating = useIsMutating({ mutationKey: ['mutation1'] })
      isMutatingArray.push(isMutating)
      return null
    }

    function Page() {
      const { mutate: mutate1 } = useMutation({
        mutationKey: ['mutation1'],
        mutationFn: () => sleep(100).then(() => 'data'),
      })
      const { mutate: mutate2 } = useMutation({
        mutationKey: ['mutation2'],
        mutationFn: () => sleep(100).then(() => 'data'),
      })

      useEffect(() => {
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

    function IsMutating() {
      const isMutating = useIsMutating({
        predicate: (mutation) =>
          mutation.options.mutationKey?.[0] === 'mutation1',
      })
      isMutatingArray.push(isMutating)
      return null
    }

    function Page() {
      const { mutate: mutate1 } = useMutation({
        mutationKey: ['mutation1'],
        mutationFn: () => sleep(100).then(() => 'data'),
      })
      const { mutate: mutate2 } = useMutation({
        mutationKey: ['mutation2'],
        mutationFn: () => sleep(100).then(() => 'data'),
      })

      useEffect(() => {
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

    function Page() {
      const isMutating = useIsMutating({}, queryClient)
      const { mutate } = useMutation(
        {
          mutationKey: ['mutation1'],
          mutationFn: () => sleep(10).then(() => 'data'),
        },
        queryClient,
      )

      useEffect(() => {
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
