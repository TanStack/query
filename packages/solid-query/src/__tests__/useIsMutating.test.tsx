import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'

import { Show, createEffect, createRenderEffect, createSignal } from 'solid-js'
import * as QueryCore from '@tanstack/query-core'
import { vi } from 'vitest'
import { QueryClientProvider, createMutation, useIsMutating } from '..'
import { createQueryClient, setActTimeout, sleep } from './utils'

describe('useIsMutating', () => {
  it('should return the number of fetching mutations', async () => {
    const isMutatings: Array<number> = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating()
      createRenderEffect(() => {
        isMutatings.push(isMutating())
      })
      return null
    }

    function Mutations() {
      const { mutate: mutate1 } = createMutation(() => ({
        mutationKey: ['mutation1'],
        mutationFn: async () => {
          await sleep(150)
          return 'data'
        },
      }))
      const { mutate: mutate2 } = createMutation(() => ({
        mutationKey: ['mutation2'],
        mutationFn: async () => {
          await sleep(50)
          return 'data'
        },
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
    await waitFor(() => expect(isMutatings).toEqual([0, 1, 2, 1, 0]))
  })

  it('should filter correctly by mutationKey', async () => {
    const isMutatings: Array<number> = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating(() => ({ mutationKey: ['mutation1'] }))
      createRenderEffect(() => {
        isMutatings.push(isMutating())
      })
      return null
    }

    function Page() {
      const { mutate: mutate1 } = createMutation(() => ({
        mutationKey: ['mutation1'],
        mutationFn: async () => {
          await sleep(100)
          return 'data'
        },
      }))
      const { mutate: mutate2 } = createMutation(() => ({
        mutationKey: ['mutation2'],
        mutationFn: async () => {
          await sleep(100)
          return 'data'
        },
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
    await waitFor(() => expect(isMutatings).toEqual([0, 1, 0]))
  })

  it('should filter correctly by predicate', async () => {
    const isMutatings: Array<number> = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating(() => ({
        predicate: (mutation) =>
          mutation.options.mutationKey?.[0] === 'mutation1',
      }))
      createRenderEffect(() => {
        isMutatings.push(isMutating())
      })
      return null
    }

    function Page() {
      const { mutate: mutate1 } = createMutation(() => ({
        mutationKey: ['mutation1'],
        mutationFn: async () => {
          await sleep(100)
          return 'data'
        },
      }))
      const { mutate: mutate2 } = createMutation(() => ({
        mutationKey: ['mutation2'],
        mutationFn: async () => {
          await sleep(100)
          return 'data'
        },
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
    await waitFor(() => expect(isMutatings).toEqual([0, 1, 0]))
  })

  it('should use provided custom queryClient', async () => {
    const queryClient = createQueryClient()
    function Page() {
      const isMutating = useIsMutating(undefined, () => queryClient)
      const { mutate } = createMutation(
        () => ({
          mutationKey: ['mutation1'],
          mutationFn: async () => {
            await sleep(10)
            return 'data'
          },
        }),
        () => queryClient,
      )
      createEffect(() => {
        mutate()
      })
      return (
        <div>
          <div>mutating: {isMutating()}</div>
        </div>
      )
    }
    render(() => <Page></Page>)
    await waitFor(() => screen.findByText('mutating: 1'))
  })

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

    const queryClient = createQueryClient()

    function IsMutating() {
      useIsMutating()
      return null
    }

    function Page() {
      const [mounted, setMounted] = createSignal(true)
      const { mutate: mutate1 } = createMutation(() => ({
        mutationKey: ['mutation1'],
        mutationFn: async () => {
          await sleep(10)
          return 'data'
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    fireEvent.click(screen.getByText('unmount'))

    // Should not display the console error
    // "Warning: Can't perform a React state update on an unmounted component"

    await sleep(20)
    MutationCacheSpy.mockRestore()
  })
})
