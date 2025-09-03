import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@solidjs/testing-library'
import { Show, createEffect, createRenderEffect, createSignal } from 'solid-js'
import * as QueryCore from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  QueryClientProvider,
  useIsMutating,
  useMutation,
} from '..'
import { setActTimeout } from './utils'

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

      createRenderEffect(() => {
        isMutatingArray.push(isMutating())
      })

      return null
    }

    function Mutations() {
      const { mutate: mutate1 } = useMutation(() => ({
        mutationKey: ['mutation1'],
        mutationFn: () => sleep(150).then(() => 'data'),
      }))
      const { mutate: mutate2 } = useMutation(() => ({
        mutationKey: ['mutation2'],
        mutationFn: () => sleep(50).then(() => 'data'),
      }))

      createEffect(() => {
        mutate1()
        setActTimeout(() => {
          mutate2()
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(150)

    expect(isMutatingArray).toEqual([0, 1, 2, 1, 0])
  })

  it('should filter correctly by mutationKey', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()

    function IsMutating() {
      const isMutating = useIsMutating(() => ({ mutationKey: ['mutation1'] }))

      createRenderEffect(() => {
        isMutatingArray.push(isMutating())
      })

      return null
    }

    function Page() {
      const { mutate: mutate1 } = useMutation(() => ({
        mutationKey: ['mutation1'],
        mutationFn: () => sleep(100).then(() => 'data'),
      }))
      const { mutate: mutate2 } = useMutation(() => ({
        mutationKey: ['mutation2'],
        mutationFn: () => sleep(100).then(() => 'data'),
      }))

      createEffect(() => {
        mutate1()
        mutate2()
      })

      return <IsMutating />
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    // Unlike React, IsMutating Wont re-render twice with mutation2
    await vi.advanceTimersByTimeAsync(100)

    expect(isMutatingArray).toEqual([0, 1, 0])
  })

  it('should filter correctly by predicate', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = new QueryClient()

    function IsMutating() {
      const isMutating = useIsMutating(() => ({
        predicate: (mutation) =>
          mutation.options.mutationKey?.[0] === 'mutation1',
      }))

      createRenderEffect(() => {
        isMutatingArray.push(isMutating())
      })

      return null
    }

    function Page() {
      const { mutate: mutate1 } = useMutation(() => ({
        mutationKey: ['mutation1'],
        mutationFn: () => sleep(100).then(() => 'data'),
      }))
      const { mutate: mutate2 } = useMutation(() => ({
        mutationKey: ['mutation2'],
        mutationFn: () => sleep(100).then(() => 'data'),
      }))

      createEffect(() => {
        mutate1()
        mutate2()
      })

      return <IsMutating />
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    // Again, No unnecessary re-renders like React
    await vi.advanceTimersByTimeAsync(100)

    expect(isMutatingArray).toEqual([0, 1, 0])
  })

  it('should use provided custom queryClient', async () => {
    const queryClient = new QueryClient()

    function Page() {
      const isMutating = useIsMutating(undefined, () => queryClient)
      const { mutate } = useMutation(
        () => ({
          mutationKey: ['mutation1'],
          mutationFn: () => sleep(20).then(() => 'data'),
        }),
        () => queryClient,
      )

      createEffect(() => {
        setActTimeout(() => {
          mutate()
        }, 10)
      })

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

  // eslint-disable-next-line vitest/expect-expect
  it('should not change state if unmounted', async () => {
    // We have to mock the MutationCache to not unsubscribe
    // the listener when the component is unmounted
    class MutationCacheMock extends QueryCore.MutationCache {
      subscribe(listener: any) {
        super.subscribe(listener)
        return () => void 0
      }
    }

    const MutationCacheSpy = vi
      .spyOn(QueryCore, 'MutationCache')
      .mockImplementation((fn) => {
        return new MutationCacheMock(fn)
      })

    const queryClient = new QueryClient()

    function IsMutating() {
      useIsMutating()
      return null
    }

    function Page() {
      const [mounted, setMounted] = createSignal(true)

      const { mutate: mutate1 } = useMutation(() => ({
        mutationKey: ['mutation1'],
        mutationFn: () => sleep(10).then(() => 'data'),
      }))

      createEffect(() => {
        mutate1()
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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    fireEvent.click(rendered.getByText('unmount'))

    // Should not display the console error
    // "Warning: Can't perform a React state update on an unmounted component"

    await vi.advanceTimersByTimeAsync(20)
    MutationCacheSpy.mockRestore()
  })
})
