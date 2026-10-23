import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@solidjs/testing-library'
import { createEffect, createSignal } from 'solid-js'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, useMutation, useMutationState } from '..'
import { renderWithClient } from './utils'

describe('useMutationState', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should return all mutation states when called without options', async () => {
    const mutationKey = createKey()

    function States() {
      const mutationStates = useMutationState()

      return <div>count: {mutationStates().length}</div>
    }

    function Mutate() {
      const mutation = useMutation(() => ({
        mutationKey,
        mutationFn: (input: number) => sleep(150).then(() => `data${input}`),
      }))

      return (
        <div>
          <button onClick={() => mutation.mutate(1)}>mutate</button>
        </div>
      )
    }

    function Page() {
      return (
        <div>
          <States />
          <Mutate />
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('count: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('count: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(150)
    expect(rendered.getByText('count: 1')).toBeInTheDocument()
  })

  it('should update when the filters change', async () => {
    const mutationKey1 = createKey()
    const mutationKey2 = createKey()
    const [mutationKey, setMutationKey] = createSignal(mutationKey1)

    function States() {
      const states = useMutationState(() => ({
        filters: { mutationKey: mutationKey() },
        select: (mutation) => mutation.state.data,
      }))

      return <div>data: {states().join(',')}</div>
    }

    function Mutate() {
      const mutation1 = useMutation(() => ({
        mutationKey: mutationKey1,
        mutationFn: () => sleep(10).then(() => 'data1'),
      }))
      const mutation2 = useMutation(() => ({
        mutationKey: mutationKey2,
        mutationFn: () => sleep(10).then(() => 'data2'),
      }))

      return (
        <div>
          <button onClick={() => mutation1.mutate()}>mutate1</button>
          <button onClick={() => mutation2.mutate()}>mutate2</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <div>
        <States />
        <Mutate />
      </div>
    ))

    fireEvent.click(rendered.getByRole('button', { name: /mutate1/i }))
    fireEvent.click(rendered.getByRole('button', { name: /mutate2/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data1')).toBeInTheDocument()

    setMutationKey(mutationKey2)
    expect(rendered.getByText('data: data2')).toBeInTheDocument()
  })

  it('should update when the queryClient changes', async () => {
    const queryClient2 = new QueryClient()
    const [client, setClient] = createSignal(queryClient)

    void queryClient2
      .getMutationCache()
      .build(queryClient2, {
        mutationFn: () => sleep(10).then(() => 'data2'),
      })
      .execute(undefined)
    await vi.advanceTimersByTimeAsync(10)

    function Page() {
      const states = useMutationState(
        () => ({ select: (mutation) => mutation.state.data }),
        client,
      )

      return <div>data: {states().join(',') || 'none'}</div>
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('data: none')).toBeInTheDocument()

    setClient(queryClient2)
    expect(rendered.getByText('data: data2')).toBeInTheDocument()

    queryClient2.clear()
  })

  it('should return variables after calling mutate', async () => {
    const variables: Array<Array<unknown>> = []
    const mutationKey = createKey()

    function Variables() {
      const states = useMutationState(() => ({
        filters: { mutationKey, status: 'pending' },
        select: (mutation) => mutation.state.variables,
      }))

      createEffect(() => {
        variables.push(states())
      })

      return null
    }

    function Mutate() {
      const mutation = useMutation(() => ({
        mutationKey,
        mutationFn: (input: number) => sleep(150).then(() => `data${input}`),
      }))

      return (
        <div>
          data: {mutation.data ?? 'null'}
          <button onClick={() => mutation.mutate(1)}>mutate</button>
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

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('data: null')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(150)
    expect(rendered.getByText('data: data1')).toBeInTheDocument()

    expect(variables).toStrictEqual([[], [1], []])
  })
})
