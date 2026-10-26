import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, useIsMutating, useMutation, useMutationState } from '..'
import { renderWithClient } from './utils'
import type { Mutation, MutationCacheNotifyEvent } from '..'

describe('useIsMutating', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the number of fetching mutations', async () => {
    const queryClient = new QueryClient()
    const key1 = createKey()
    const key2 = createKey()

    function IsMutating() {
      const isMutating = useIsMutating()
      return <div>mutating: {isMutating}</div>
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
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(1)
    expect(rendered.getByText('mutating: 2')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(30)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
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
    const queryClient = new QueryClient()
    const key1 = createKey()
    const key2 = createKey()

    function IsMutating() {
      const isMutating = useIsMutating({ mutationKey: key1 })
      return <div>mutating: {isMutating}</div>
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

    const rendered = renderWithClient(queryClient, <Page />)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(1)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  it('should filter correctly by predicate', async () => {
    const queryClient = new QueryClient()
    const key1 = createKey()
    const key2 = createKey()

    function IsMutating() {
      const isMutating = useIsMutating({
        predicate: (mutation) => mutation.options.mutationKey?.[0] === key1[0],
      })
      return <div>mutating: {isMutating}</div>
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

    const rendered = renderWithClient(queryClient, <Page />)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(1)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  it('should use provided custom queryClient', async () => {
    const queryClient = new QueryClient()
    const key = createKey()

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

  it('should update when filters change without a cache update', async () => {
    const queryClient = new QueryClient()
    const key = createKey()
    const otherKey = createKey()
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationKey: key,
      mutationFn: () => sleep(100),
    })
    const promise = mutation.execute(undefined)
    await vi.advanceTimersByTimeAsync(0)

    function Page({ mutationKey }: { mutationKey: Array<string> }) {
      const count = useIsMutating({ mutationKey })
      return <div>mutating: {count}</div>
    }

    const rendered = renderWithClient(queryClient, <Page mutationKey={key} />)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    rendered.rerender(<Page mutationKey={otherKey} />)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(100)
    await promise
  })
})

describe('useMutationState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should update when filters change without a cache update', () => {
    const queryClient = new QueryClient()
    const key1 = createKey()
    const key2 = createKey()
    const cache = queryClient.getMutationCache()
    cache.build(queryClient, { mutationKey: key1 })
    cache.build(queryClient, { mutationKey: key2 })
    const onCacheChange = vi.fn<(event: MutationCacheNotifyEvent) => void>()
    const unsubscribe = cache.subscribe(onCacheChange)

    function Page({ mutationKey }: { mutationKey: Array<string> }) {
      const keys = useMutationState({
        filters: { mutationKey },
        select: (mutation) => mutation.options.mutationKey,
      })
      return <div>keys: {JSON.stringify(keys)}</div>
    }

    const rendered = renderWithClient(queryClient, <Page mutationKey={key1} />)
    expect(
      rendered.getByText(`keys: ${JSON.stringify([key1])}`),
    ).toBeInTheDocument()

    rendered.rerender(<Page mutationKey={key2} />)
    expect(
      rendered.getByText(`keys: ${JSON.stringify([key2])}`),
    ).toBeInTheDocument()

    rendered.rerender(<Page mutationKey={createKey()} />)
    expect(rendered.getByText('keys: []')).toBeInTheDocument()
    expect(onCacheChange).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('should update when select changes without a cache update', () => {
    const queryClient = new QueryClient()
    const key = createKey()
    queryClient.getMutationCache().build(queryClient, { mutationKey: key })

    function Page({ select }: { select: (mutation: Mutation) => unknown }) {
      const result = useMutationState({ select })
      return <div>result: {JSON.stringify(result)}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <Page select={(mutation) => mutation.options.mutationKey} />,
    )
    expect(
      rendered.getByText(`result: ${JSON.stringify([key])}`),
    ).toBeInTheDocument()

    rendered.rerender(<Page select={(mutation) => mutation.state.status} />)
    expect(rendered.getByText('result: ["idle"]')).toBeInTheDocument()
  })

  it.each(['object', 'Date'] as const)(
    'should recompute %s results on rerender with stable filters and select',
    (resultType) => {
      const queryClient = new QueryClient()
      const key = createKey()
      const cache = queryClient.getMutationCache()
      const existingMutation = cache.build(queryClient, {
        mutationKey: key,
        meta: { time: 0 },
      })
      const state = existingMutation.state
      const filters = { mutationKey: key }
      const select = (mutation: Mutation) =>
        resultType === 'Date'
          ? new Date(Number(mutation.meta?.time))
          : { time: mutation.meta?.time }
      const options = { filters, select }
      const onCacheChange = vi.fn<(event: MutationCacheNotifyEvent) => void>()
      const unsubscribe = cache.subscribe(onCacheChange)

      function Page() {
        const result = useMutationState(options)
        return <div>result: {JSON.stringify(result)}</div>
      }

      const rendered = renderWithClient(queryClient, <Page />)
      expect(
        rendered.getByText(
          resultType === 'Date'
            ? 'result: ["1970-01-01T00:00:00.000Z"]'
            : 'result: [{"time":0}]',
        ),
      ).toBeInTheDocument()

      existingMutation.setOptions({
        ...existingMutation.options,
        meta: { time: 1000 },
      })
      rendered.rerender(<Page />)
      expect(
        rendered.getByText(
          resultType === 'Date'
            ? 'result: ["1970-01-01T00:00:01.000Z"]'
            : 'result: [{"time":1000}]',
        ),
      ).toBeInTheDocument()
      expect(existingMutation.state).toBe(state)
      expect(onCacheChange).not.toHaveBeenCalled()
      unsubscribe()
    },
  )

  it('should render selector results that cannot be structurally shared', () => {
    const queryClient = new QueryClient()
    const key = createKey()
    queryClient.getMutationCache().build(queryClient, { mutationKey: key })

    function Page({ time }: { time: number }) {
      const result = useMutationState({
        filters: { mutationKey: key },
        select: () => new Date(time),
      })

      return <div>date: {result[0]?.toISOString()}</div>
    }

    const rendered = renderWithClient(queryClient, <Page time={0} />)
    expect(
      rendered.getByText('date: 1970-01-01T00:00:00.000Z'),
    ).toBeInTheDocument()

    rendered.rerender(<Page time={1000} />)
    expect(
      rendered.getByText('date: 1970-01-01T00:00:01.000Z'),
    ).toBeInTheDocument()
  })

  it('should update Date selector results when mutation state changes', async () => {
    const queryClient = new QueryClient()
    const key = createKey()
    const filters = { mutationKey: key }
    const select = (mutation: Mutation) =>
      new Date(mutation.state.status === 'success' ? 1000 : 0)

    function Dates() {
      const { mutate } = useMutation({
        mutationKey: key,
        mutationFn: () => sleep(10),
      })
      const result = useMutationState({ filters, select })
      return (
        <div>
          <div>dates: {JSON.stringify(result)}</div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Dates />)
    expect(rendered.getByText('dates: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: 'mutate' }))
    await vi.advanceTimersByTimeAsync(1)
    expect(
      rendered.getByText('dates: ["1970-01-01T00:00:00.000Z"]'),
    ).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('dates: ["1970-01-01T00:00:01.000Z"]'),
    ).toBeInTheDocument()
  })

  it('should update when only the mutation state changes', async () => {
    const queryClient = new QueryClient()
    const key = createKey()
    const filters = { mutationKey: key }
    const select = (mutation: Mutation) => mutation.state.status

    function Statuses() {
      const result = useMutationState({ filters, select })
      return <div>statuses: {JSON.stringify(result)}</div>
    }

    function Mutate() {
      const { mutate } = useMutation({
        mutationKey: key,
        mutationFn: () => sleep(10),
      })
      return <button onClick={() => mutate()}>mutate</button>
    }

    const rendered = renderWithClient(
      queryClient,
      <div>
        <Statuses />
        <Mutate />
      </div>,
    )
    expect(rendered.getByText('statuses: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: 'mutate' }))
    await vi.advanceTimersByTimeAsync(1)
    expect(rendered.getByText('statuses: ["pending"]')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('statuses: ["success"]')).toBeInTheDocument()
  })

  it.each(['stable', 'inline'] as const)(
    'should preserve the result reference with %s inputs',
    (inputs) => {
      const queryClient = new QueryClient()
      const key = createKey()
      queryClient.getMutationCache().build(queryClient, { mutationKey: key })
      const onResult =
        vi.fn<
          (result: Array<{ key: ReadonlyArray<unknown> | undefined }>) => void
        >()
      const filters = { status: 'idle' as const }
      const select = (mutation: Mutation) => ({
        key: mutation.options.mutationKey,
      })

      function Page() {
        const result = useMutationState({
          filters: inputs === 'inline' ? { ...filters } : filters,
          select: inputs === 'inline' ? (mutation) => select(mutation) : select,
        })
        React.useEffect(() => {
          onResult(result)
        }, [result])
        return <div>result: {JSON.stringify(result)}</div>
      }

      const rendered = renderWithClient(queryClient, <Page />)
      const expected = `result: ${JSON.stringify([{ key }])}`
      expect(rendered.getByText(expected)).toBeInTheDocument()
      expect(onResult).toHaveBeenCalledTimes(1)

      rendered.rerender(<Page />)
      expect(rendered.getByText(expected)).toBeInTheDocument()
      expect(onResult).toHaveBeenCalledTimes(1)
    },
  )

  it('should read from a changed custom queryClient', () => {
    const client1 = new QueryClient()
    const client2 = new QueryClient()
    const key1 = createKey()
    const key2 = createKey()
    client1.getMutationCache().build(client1, { mutationKey: key1 })
    client2.getMutationCache().build(client2, { mutationKey: key2 })
    const select = (mutation: Mutation) => mutation.options.mutationKey

    function Page({ client }: { client: QueryClient }) {
      const keys = useMutationState({ select }, client)
      return <div>keys: {JSON.stringify(keys)}</div>
    }

    const rendered = render(<Page client={client1} />)
    expect(
      rendered.getByText(`keys: ${JSON.stringify([key1])}`),
    ).toBeInTheDocument()

    rendered.rerender(<Page client={client2} />)
    expect(
      rendered.getByText(`keys: ${JSON.stringify([key2])}`),
    ).toBeInTheDocument()
    expect(client1.getMutationCache().hasListeners()).toBe(false)
    expect(client2.getMutationCache().hasListeners()).toBe(true)
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
    expect(queryClient.getMutationCache().getAll()).toStrictEqual([])
    expect(rendered.getByText('data: []')).toBeInTheDocument()
  })

  it('should return variables after calling mutate', async () => {
    const queryClient = new QueryClient()
    const mutationKey = ['mutation']

    function Variables() {
      const variables = useMutationState({
        filters: { mutationKey, status: 'pending' },
        select: (mutation) => mutation.state.variables,
      })

      return <div>variables: {JSON.stringify(variables)}</div>
    }

    function Mutate() {
      const { mutate, data } = useMutation({
        mutationKey,
        mutationFn: (input: number) => sleep(150).then(() => `data${input}`),
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
    expect(rendered.getByText('variables: []')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(1)
    expect(rendered.getByText('variables: [1]')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(150)
    expect(rendered.getByText('data: data1')).toBeInTheDocument()
    expect(rendered.getByText('variables: []')).toBeInTheDocument()
  })
})
