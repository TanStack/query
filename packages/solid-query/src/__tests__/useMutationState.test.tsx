import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@solidjs/testing-library'
import { createEffect } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
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
    const mutationKey = queryKey()

    function States() {
      const mutationStates = useMutationState()

      return <div>count: {mutationStates().length}</div>
    }

    function Mutate() {
      const mutation = useMutation(() => ({
        mutationKey,
        mutationFn: (input: number) => sleep(150).then(() => 'data' + input),
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

  it('should return variables after calling mutate', async () => {
    const variables: Array<Array<unknown>> = []
    const mutationKey = queryKey()

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
        mutationFn: (input: number) => sleep(150).then(() => 'data' + input),
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

    expect(variables).toEqual([[], [1], []])
  })
})
