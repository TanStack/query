import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@solidjs/testing-library'
import { createRenderEffect } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, useMutation, useMutationState } from '..'
import { renderWithClient } from './utils'
import type { MutationOptions } from '@tanstack/query-core'

/**
 * Drives a mutation through the mutation cache directly, outside any
 * useMutation action transaction. Cache events emitted during a
 * useMutation flight are delivered inside the action's transaction, where
 * useMutationState's plain-signal write is held until settle — the
 * in-flight state never commits to the DOM (see the skipped test below).
 * Feeding the cache directly keeps the hook's own contract observable.
 */
function startMutation<TData, TVariables>(
  client: QueryClient,
  options: MutationOptions<TData, Error, TVariables>,
  variables: TVariables,
): Promise<TData> {
  return client.getMutationCache().build(client, options).execute(variables)
}

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
      return (
        <div>
          <button
            onClick={() =>
              startMutation(
                queryClient,
                {
                  mutationKey,
                  mutationFn: (input: number) =>
                    sleep(150).then(() => 'data' + input),
                },
                1,
              )
            }
          >
            mutate
          </button>
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

  it('should return variables while the mutation is pending', async () => {
    const variables: Array<Array<unknown>> = []
    const mutationKey = queryKey()

    function Variables() {
      const states = useMutationState(() => ({
        filters: { mutationKey, status: 'pending' },
        select: (mutation) => mutation.state.variables,
      }))

      createRenderEffect(
        () => [...states()],
        (s) => {
          variables.push(s)
        },
      )

      return null
    }

    function Page() {
      return (
        <div>
          <Variables />
          <button
            onClick={() =>
              startMutation(
                queryClient,
                {
                  mutationKey,
                  mutationFn: (input: number) =>
                    sleep(150).then(() => 'data' + input),
                },
                1,
              )
            }
          >
            mutate
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(variables).toEqual([[], [1]])

    await vi.advanceTimersByTimeAsync(150)
    expect(variables).toEqual([[], [1], []])
  })

  it('should observe pending state of mutations started by useMutation', async () => {
    const mutationKey = queryKey()

    function States() {
      const mutationStates = useMutationState(() => ({
        filters: { mutationKey, status: 'pending' },
      }))

      return <div>pending: {mutationStates().length}</div>
    }

    function Mutate() {
      const mutation = useMutation(() => ({
        mutationKey,
        mutationFn: (input: number) => sleep(150).then(() => 'data' + input),
      }))

      return <button onClick={() => mutation.mutate(1)}>mutate</button>
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

    expect(rendered.getByText('pending: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('pending: 1')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(150)
    expect(rendered.getByText('pending: 0')).toBeInTheDocument()
  })
})
