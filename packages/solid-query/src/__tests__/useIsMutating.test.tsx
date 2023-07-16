import { fireEvent, screen, waitFor } from 'solid-testing-library'

import {
  ErrorBoundary,
  Show,
  createContext,
  createEffect,
  createRenderEffect,
  createSignal,
} from 'solid-js'
import { render } from 'solid-testing-library'
import {
  QueryClient,
  QueryClientProvider,
  createMutation,
  useIsMutating,
} from '..'
import * as MutationCacheModule from '../../../query-core/src/mutationCache'
import { createQueryClient, sleep } from './utils'
import { setActTimeout } from './utils'

describe('useIsMutating', () => {
  it('should return the number of fetching mutations', async () => {
    const isMutatings: number[] = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating()
      createRenderEffect(() => {
        isMutatings.push(isMutating())
      })
      return null
    }

    function Mutations() {
      const { mutate: mutate1 } = createMutation(['mutation1'], async () => {
        await sleep(150)
        return 'data'
      })
      const { mutate: mutate2 } = createMutation(['mutation2'], async () => {
        await sleep(50)
        return 'data'
      })

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
    const isMutatings: number[] = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating(['mutation1'])
      createRenderEffect(() => {
        isMutatings.push(isMutating())
      })
      return null
    }

    function Page() {
      const { mutate: mutate1 } = createMutation(['mutation1'], async () => {
        await sleep(100)
        return 'data'
      })
      const { mutate: mutate2 } = createMutation(['mutation2'], async () => {
        await sleep(100)
        return 'data'
      })

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
    const isMutatings: number[] = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating({
        predicate: (mutation) =>
          mutation.options.mutationKey?.[0] === 'mutation1',
      })
      createRenderEffect(() => {
        isMutatings.push(isMutating())
      })
      return null
    }

    function Page() {
      const { mutate: mutate1 } = createMutation(['mutation1'], async () => {
        await sleep(100)
        return 'data'
      })
      const { mutate: mutate2 } = createMutation(['mutation2'], async () => {
        await sleep(100)
        return 'data'
      })

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

  it('should not change state if unmounted', async () => {
    // We have to mock the MutationCache to not unsubscribe
    // the listener when the component is unmounted
    class MutationCacheMock extends MutationCacheModule.MutationCache {
      subscribe(listener: any) {
        super.subscribe(listener)
        return () => void 0
      }
    }

    const MutationCacheSpy = jest
      .spyOn(MutationCacheModule, 'MutationCache')
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
      const { mutate: mutate1 } = createMutation(['mutation1'], async () => {
        await sleep(10)
        return 'data'
      })

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

  describe('with custom context', () => {
    it('should return the number of fetching mutations', async () => {
      const context = createContext<QueryClient | undefined>(undefined)

      const isMutatings: number[] = []
      const queryClient = new QueryClient()

      function IsMutating() {
        const isMutating = useIsMutating(undefined, { context })

        createRenderEffect(() => {
          isMutatings.push(isMutating())
        })

        return null
      }

      function Page() {
        const { mutate: mutate1 } = createMutation(
          ['mutation1'],
          async () => {
            await sleep(150)
            return 'data'
          },
          { context },
        )
        const { mutate: mutate2 } = createMutation(
          ['mutation2'],
          async () => {
            await sleep(50)
            return 'data'
          },
          { context },
        )

        createEffect(() => {
          mutate1()
          setActTimeout(() => {
            mutate2()
          }, 50)
        })

        return <IsMutating />
      }

      render(() => (
        <QueryClientProvider client={queryClient} context={context}>
          <Page />
        </QueryClientProvider>
      ))
      await waitFor(() => expect(isMutatings).toEqual([0, 1, 2, 1, 0]))
    })

    it('should throw if the context is not passed to useIsMutating', async () => {
      const context = createContext<QueryClient | undefined>(undefined)

      const isMutatings: number[] = []
      const queryClient = new QueryClient()

      function IsMutating() {
        const isMutating = useIsMutating(undefined)
        isMutatings.push(isMutating())
        return null
      }

      function Page() {
        const { mutate } = createMutation(['mutation'], async () => 'data', {
          useErrorBoundary: true,
          context,
        })

        createEffect(() => {
          mutate()
        })

        return <IsMutating />
      }

      render(() => (
        <QueryClientProvider client={queryClient} context={context}>
          <ErrorBoundary fallback={() => <div>error boundary</div>}>
            <Page />
          </ErrorBoundary>
        </QueryClientProvider>
      ))

      await waitFor(() => screen.getByText('error boundary'))
    })
  })
})
