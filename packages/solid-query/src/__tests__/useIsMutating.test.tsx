import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@solidjs/testing-library'
import { Show, createEffect, createRenderEffect, createSignal } from 'solid-js'
import * as QueryCore from '@tanstack/query-core'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, useIsMutating, useMutation } from '..'
import { renderWithClient, setActTimeout } from './utils'

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
    const isMutatingArray: Array<number> = []
    const mutationKey1 = createKey()
    const mutationKey2 = createKey()

    function IsMutating() {
      const isMutating = useIsMutating()

      createRenderEffect(() => {
        isMutatingArray.push(isMutating())
      })

      return null
    }

    function Mutations() {
      const mutation1 = useMutation(() => ({
        mutationKey: mutationKey1,
        mutationFn: () => sleep(150).then(() => 'data'),
      }))
      const mutation2 = useMutation(() => ({
        mutationKey: mutationKey2,
        mutationFn: () => sleep(50).then(() => 'data'),
      }))

      createEffect(() => {
        mutation1.mutate()
        setActTimeout(() => {
          mutation2.mutate()
        }, 50)
      })

      return null
    }

    function Page() {
      return (
        <div>
          <IsMutating />
          <Mutations />
        </div>
      )
    }

    renderWithClient(queryClient, () => <Page />)

    await vi.advanceTimersByTimeAsync(150)
    expect(isMutatingArray).toStrictEqual([0, 1, 2, 1, 0])
  })

  it('should filter correctly by mutationKey', async () => {
    const isMutatingArray: Array<number> = []
    const mutationKey1 = createKey()
    const mutationKey2 = createKey()

    function IsMutating() {
      const isMutating = useIsMutating(() => ({ mutationKey: mutationKey1 }))

      createRenderEffect(() => {
        isMutatingArray.push(isMutating())
      })

      return null
    }

    function Page() {
      const mutation1 = useMutation(() => ({
        mutationKey: mutationKey1,
        mutationFn: () => sleep(100).then(() => 'data'),
      }))
      const mutation2 = useMutation(() => ({
        mutationKey: mutationKey2,
        mutationFn: () => sleep(100).then(() => 'data'),
      }))

      createEffect(() => {
        mutation1.mutate()
        mutation2.mutate()
      })

      return <IsMutating />
    }

    renderWithClient(queryClient, () => <Page />)

    // Unlike React, IsMutating Wont re-render twice with mutation2
    await vi.advanceTimersByTimeAsync(100)
    expect(isMutatingArray).toStrictEqual([0, 1, 0])
  })

  it('should filter correctly by predicate', async () => {
    const isMutatingArray: Array<number> = []
    const mutationKey1 = createKey()
    const mutationKey2 = createKey()

    function IsMutating() {
      const isMutating = useIsMutating(() => ({
        predicate: (mutation) =>
          mutation.options.mutationKey?.[0] === mutationKey1[0],
      }))

      createRenderEffect(() => {
        isMutatingArray.push(isMutating())
      })

      return null
    }

    function Page() {
      const mutation1 = useMutation(() => ({
        mutationKey: mutationKey1,
        mutationFn: () => sleep(100).then(() => 'data'),
      }))
      const mutation2 = useMutation(() => ({
        mutationKey: mutationKey2,
        mutationFn: () => sleep(100).then(() => 'data'),
      }))

      createEffect(() => {
        mutation1.mutate()
        mutation2.mutate()
      })

      return <IsMutating />
    }

    renderWithClient(queryClient, () => <Page />)

    // Again, No unnecessary re-renders like React
    await vi.advanceTimersByTimeAsync(100)
    expect(isMutatingArray).toStrictEqual([0, 1, 0])
  })

  it('should use provided custom queryClient', async () => {
    const customClient = new QueryClient()
    const mutationKey1 = createKey()

    function Page() {
      const isMutating = useIsMutating(undefined, () => customClient)
      const mutation = useMutation(
        () => ({
          mutationKey: mutationKey1,
          mutationFn: () => sleep(20).then(() => 'data'),
        }),
        () => customClient,
      )

      createEffect(() => {
        setActTimeout(() => {
          mutation.mutate()
        }, 10)
      })

      return (
        <div>
          <div>mutating: {isMutating()}</div>
        </div>
      )
    }

    const rendered = render(() => <Page />)

    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(20)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  it('should resubscribe when a custom queryClient changes', async () => {
    const queryClient1 = new QueryClient()
    const queryClient2 = new QueryClient()
    const [client, setClient] = createSignal(queryClient1)
    const mutationCache1 = queryClient1.getMutationCache()
    const originalSubscribe1 = mutationCache1.subscribe.bind(mutationCache1)
    const unsubscribe1 = vi.fn<() => void>()

    vi.spyOn(mutationCache1, 'subscribe').mockImplementation((listener) => {
      const cleanup = originalSubscribe1(listener)

      return () => {
        unsubscribe1()
        cleanup()
      }
    })

    function Page() {
      const isMutating = useIsMutating(undefined, client)

      return <div>mutating: {isMutating()}</div>
    }

    const rendered = render(() => <Page />)

    const firstMutation = queryClient1.getMutationCache().build(queryClient1, {
      mutationFn: () => sleep(20).then(() => 'data1'),
    })
    const firstMutationPromise = firstMutation.execute(undefined)

    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()

    setClient(queryClient2)
    expect(unsubscribe1).toHaveBeenCalledTimes(1)
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()

    const secondMutation = queryClient2.getMutationCache().build(queryClient2, {
      mutationFn: () => sleep(20).then(() => 'data2'),
    })
    const secondMutationPromise = secondMutation.execute(undefined)

    expect(rendered.getByText('mutating: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(20)
    await Promise.all([firstMutationPromise, secondMutationPromise])
    expect(rendered.getByText('mutating: 0')).toBeInTheDocument()
  })

  it('should not change state if unmounted', async () => {
    const states: Array<number> = []
    // We have to mock the MutationCache to not unsubscribe
    // the listener when the component is unmounted
    class MutationCacheMock extends QueryCore.MutationCache {
      override subscribe(listener: any) {
        super.subscribe(listener)
        return () => void 0
      }
    }

    vi.spyOn(QueryCore, 'MutationCache').mockImplementation((fn) => {
      return new MutationCacheMock(fn)
    })

    // Create the client after mocking MutationCache so it uses the mock,
    // not the centralized client from beforeEach
    const spiedClient = new QueryClient()
    const mutationKey1 = createKey()

    function IsMutating() {
      const isMutating = useIsMutating()
      createRenderEffect(() => {
        states.push(isMutating())
      })
      return null
    }

    function Page() {
      const [mounted, setMounted] = createSignal(true)

      const mutation1 = useMutation(() => ({
        mutationKey: mutationKey1,
        mutationFn: () => sleep(10).then(() => 'data'),
      }))

      createEffect(() => {
        mutation1.mutate()
      })

      return (
        <div>
          <button onClick={() => setMounted(false)}>unmount</button>
          <Show when={mounted()}>
            <IsMutating />
          </Show>
        </div>
      )
    }

    const rendered = renderWithClient(spiedClient, () => <Page />)
    expect(states).toStrictEqual([0, 1])

    fireEvent.click(rendered.getByText('unmount'))
    expect(spiedClient.getMutationCache().getAll()[0]?.state.status).toBe(
      'pending',
    )

    await vi.advanceTimersByTimeAsync(20)
    expect(spiedClient.getMutationCache().getAll()[0]?.state.status).toBe(
      'success',
    )
    expect(states).toStrictEqual([0, 1])
  })
})
