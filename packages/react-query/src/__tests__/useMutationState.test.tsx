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

  it('should update the result when the filters change without a cache update', async () => {
    const queryClient = new QueryClient()
    const key1 = queryKey()
    const key2 = queryKey()

    function Variables({ mutationKey }: { mutationKey: Array<string> }) {
      const variables = useMutationState({
        filters: { mutationKey },
        select: (mutation) => mutation.state.variables,
      })

      return <div>variables: {variables.join(',')}</div>
    }

    function Page() {
      const [mutationKey, setMutationKey] = React.useState(key1)
      const { mutate: mutate1 } = useMutation({
        mutationKey: key1,
        mutationFn: (input: number) => sleep(10).then(() => 'data' + input),
      })
      const { mutate: mutate2 } = useMutation({
        mutationKey: key2,
        mutationFn: (input: number) => sleep(10).then(() => 'data' + input),
      })

      return (
        <div>
          <Variables mutationKey={mutationKey} />
          <button
            onClick={() => {
              mutate1(1)
              mutate2(2)
            }}
          >
            mutate
          </button>
          <button onClick={() => setMutationKey(key2)}>switch</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('variables: 1')).toBeInTheDocument()

    // only the filters change - nothing touches the mutation cache
    fireEvent.click(rendered.getByRole('button', { name: /switch/i }))
    expect(rendered.getByText('variables: 2')).toBeInTheDocument()
  })

  it('should update the result when the select changes', async () => {
    const queryClient = new QueryClient()
    const key = queryKey()

    function Selected({ pick }: { pick: (m: any) => unknown }) {
      const values = useMutationState({
        filters: { mutationKey: key },
        select: pick,
      })

      return <div>value: {String(values[0])}</div>
    }

    function Page() {
      const [pick, setPick] = React.useState(
        () => (m: any) => m.state.variables as unknown,
      )
      const { mutate } = useMutation({
        mutationKey: key,
        mutationFn: (input: number) => sleep(10).then(() => 'data' + input),
      })

      return (
        <div>
          <Selected pick={pick} />
          <button onClick={() => mutate(7)}>mutate</button>
          <button onClick={() => setPick(() => (m: any) => m.state.status)}>
            switch
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('value: 7')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /switch/i }))
    expect(rendered.getByText('value: success')).toBeInTheDocument()
  })

  it('should empty the result when the filters stop matching', async () => {
    const queryClient = new QueryClient()
    const key = queryKey()
    const other = queryKey()

    function Variables({ mutationKey }: { mutationKey: Array<string> }) {
      const variables = useMutationState({
        filters: { mutationKey },
        select: (mutation) => mutation.state.variables,
      })

      return <div>count: {variables.length}</div>
    }

    function Page() {
      const [mutationKey, setMutationKey] = React.useState(key)
      const { mutate } = useMutation({
        mutationKey: key,
        mutationFn: (input: number) => sleep(10).then(() => 'data' + input),
      })

      return (
        <div>
          <Variables mutationKey={mutationKey} />
          <button onClick={() => mutate(1)}>mutate</button>
          <button onClick={() => setMutationKey(other)}>switch</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('count: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /switch/i }))
    expect(rendered.getByText('count: 0')).toBeInTheDocument()
  })

  it('should keep the same result reference across an unrelated render', async () => {
    const queryClient = new QueryClient()
    const key = queryKey()
    const seen: Array<unknown> = []

    function Variables() {
      const variables = useMutationState({
        filters: { mutationKey: key },
        select: (mutation) => ({ ...mutation.state }),
      })
      seen.push(variables)

      return null
    }

    function Page() {
      const [, rerender] = React.useState(0)
      const { mutate } = useMutation({
        mutationKey: key,
        mutationFn: (input: number) => sleep(10).then(() => 'data' + input),
      })

      return (
        <div>
          <Variables />
          <button onClick={() => mutate(1)}>mutate</button>
          <button onClick={() => rerender((n) => n + 1)}>rerender</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    const before = seen.length
    expect((seen[before - 1] as Array<unknown>).length).toBe(1)

    fireEvent.click(rendered.getByRole('button', { name: /rerender/i }))

    // the snapshot must stay referentially stable, or useSyncExternalStore loops
    expect(seen.length).toBeGreaterThan(before)
    expect(seen[seen.length - 1]).toBe(seen[before - 1])
  })

  it('should not re-run a stable select on an unrelated render', async () => {
    const queryClient = new QueryClient()
    const key = queryKey()
    let selectCalls = 0
    const select = (mutation: any) => {
      selectCalls++

      return mutation.state.variables
    }

    function Variables() {
      const [, rerender] = React.useState(0)
      useMutationState({ filters: { mutationKey: key }, select })

      return <button onClick={() => rerender((n) => n + 1)}>rerender</button>
    }

    function Page() {
      const { mutate } = useMutation({
        mutationKey: key,
        mutationFn: (input: number) => sleep(10).then(() => 'data' + input),
      })

      return (
        <div>
          <Variables />
          <button onClick={() => mutate(1)}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(11)
    const before = selectCalls

    // the re-render starts inside the subtree, so nothing notifies the cache
    fireEvent.click(rendered.getByRole('button', { name: /rerender/i }))
    fireEvent.click(rendered.getByRole('button', { name: /rerender/i }))

    expect(selectCalls).toBe(before)
  })

  it('should update useIsMutating when the filters change', async () => {
    const queryClient = new QueryClient()
    const key1 = queryKey()
    const key2 = queryKey()

    function Count({ mutationKey }: { mutationKey: Array<string> }) {
      const count = useIsMutating({ mutationKey })

      return <div>count: {count}</div>
    }

    function Page() {
      const [mutationKey, setMutationKey] = React.useState(key1)
      const { mutate } = useMutation({
        mutationKey: key1,
        mutationFn: (input: number) => sleep(50).then(() => 'data' + input),
      })

      return (
        <div>
          <Count mutationKey={mutationKey} />
          <button onClick={() => mutate(1)}>mutate</button>
          <button onClick={() => setMutationKey(key2)}>switch</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('count: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /switch/i }))
    expect(rendered.getByText('count: 0')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(41)
  })
})
