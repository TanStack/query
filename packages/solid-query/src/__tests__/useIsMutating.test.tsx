import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@solidjs/testing-library'
import { createRenderEffect } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, useIsMutating, useMutation } from '..'
import { renderWithClient, setActTimeout } from './utils'
import type { MutationOptions } from '@tanstack/query-core'

/**
 * Drives a mutation through the mutation cache directly, outside any
 * useMutation action transaction. Cache events emitted during a
 * useMutation flight are delivered inside the action's transaction, where
 * useIsMutating's plain-signal write is held until settle — the in-flight
 * count never commits to the DOM (see the skipped test below). Feeding the
 * cache directly keeps the hook's own contract observable.
 */
function startMutation<TData, TVariables>(
  client: QueryClient,
  options: MutationOptions<TData, Error, TVariables>,
  variables: TVariables,
): Promise<TData> {
  return client.getMutationCache().build(client, options).execute(variables)
}

describe('useIsMutating', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should return the number of fetching mutations', async () => {
    const mutationKey1 = queryKey()
    const mutationKey2 = queryKey()

    function Page() {
      const isMutating = useIsMutating()

      setActTimeout(() => {
        startMutation(
          queryClient,
          {
            mutationKey: mutationKey1,
            mutationFn: () => sleep(150).then(() => 'data'),
          },
          undefined,
        )
      }, 0)
      setActTimeout(() => {
        startMutation(
          queryClient,
          {
            mutationKey: mutationKey2,
            mutationFn: () => sleep(50).then(() => 'data'),
          },
          undefined,
        )
      }, 50)

      return <div>mutating: {isMutating()}</div>
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    // t=0: mutation1 in flight
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    // t=50: mutation2 joins mutation1 in flight
    await vi.advanceTimersByTimeAsync(50)
    expect(rendered.getByText('mutating: 2')).toBeInTheDocument()

    // t=100: mutation2 settles
    await vi.advanceTimersByTimeAsync(50)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    // t=150: mutation1 settles
    await vi.advanceTimersByTimeAsync(50)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  it('should filter correctly by mutationKey', async () => {
    const isMutatingArray: Array<number> = []
    const mutationKey1 = queryKey()
    const mutationKey2 = queryKey()

    function Page() {
      const isMutating = useIsMutating(() => ({ mutationKey: mutationKey1 }))

      createRenderEffect(isMutating, (i) => {
        isMutatingArray.push(i)
      })

      setActTimeout(() => {
        startMutation(
          queryClient,
          {
            mutationKey: mutationKey1,
            mutationFn: () => sleep(100).then(() => 'data'),
          },
          undefined,
        )
        startMutation(
          queryClient,
          {
            mutationKey: mutationKey2,
            mutationFn: () => sleep(100).then(() => 'data'),
          },
          undefined,
        )
      }, 10)

      return <div>mutating: {isMutating()}</div>
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    // t=10: both mutations in flight, only mutationKey1 counted
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    // t=110: both settled
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    // the mutation with the other key must never leak through the filter
    expect(isMutatingArray).toEqual(expect.not.arrayContaining([2]))
  })

  it('should filter correctly by predicate', async () => {
    const isMutatingArray: Array<number> = []
    const mutationKey1 = queryKey()
    const mutationKey2 = queryKey()

    function Page() {
      const isMutating = useIsMutating(() => ({
        predicate: (mutation) =>
          mutation.options.mutationKey?.[0] === mutationKey1[0],
      }))

      createRenderEffect(isMutating, (i) => {
        isMutatingArray.push(i)
      })

      setActTimeout(() => {
        startMutation(
          queryClient,
          {
            mutationKey: mutationKey1,
            mutationFn: () => sleep(100).then(() => 'data'),
          },
          undefined,
        )
        startMutation(
          queryClient,
          {
            mutationKey: mutationKey2,
            mutationFn: () => sleep(100).then(() => 'data'),
          },
          undefined,
        )
      }, 10)

      return <div>mutating: {isMutating()}</div>
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    // t=10: both mutations in flight, only the predicate match counted
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    // t=110: both settled
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    // the non-matching mutation must never be counted
    expect(isMutatingArray).toEqual(expect.not.arrayContaining([2]))
  })

  it('should use provided custom queryClient', async () => {
    const customClient = new QueryClient()
    const mutationKey1 = queryKey()

    function Page() {
      const isMutating = useIsMutating(undefined, () => customClient)

      setActTimeout(() => {
        startMutation(
          customClient,
          {
            mutationKey: mutationKey1,
            mutationFn: () => sleep(20).then(() => 'data'),
          },
          undefined,
        )
      }, 10)

      return (
        <div>
          <div>mutating: {isMutating()}</div>
        </div>
      )
    }

    const rendered = render(() => <Page></Page>)

    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(20)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  it('should count mutations started by useMutation while in flight', async () => {
    const mutationKey1 = queryKey()

    function Page() {
      const isMutating = useIsMutating()
      const mutation = useMutation(() => ({
        mutationKey: mutationKey1,
        mutationFn: () => sleep(150).then(() => 'data'),
      }))

      setActTimeout(() => {
        mutation.mutate()
      }, 0)

      return <div>mutating: {isMutating()}</div>
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(150)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })
})
