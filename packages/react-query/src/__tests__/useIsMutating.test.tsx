import { fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient } from '@tanstack/query-core'
import { useIsMutating } from '../useIsMutating'
import { useMutation } from '../useMutation'
import * as MutationCacheModule from '../../../query-core/src/mutationCache'
import {
  createQueryClient,
  renderWithClient,
  setActTimeout,
  sleep,
} from './utils'

describe('useIsMutating', () => {
  it('should return the number of fetching mutations', async () => {
    const isMutatings: number[] = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating()
      isMutatings.push(isMutating)
      return null
    }

    function Mutations() {
      const { mutate: mutate1 } = useMutation(['mutation1'], async () => {
        await sleep(150)
        return 'data'
      })
      const { mutate: mutate2 } = useMutation(['mutation2'], async () => {
        await sleep(50)
        return 'data'
      })

      React.useEffect(() => {
        mutate1()
        setActTimeout(() => {
          mutate2()
        }, 50)
      }, [mutate1, mutate2])

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

    renderWithClient(queryClient, <Page />)
    await waitFor(() => expect(isMutatings).toEqual([0, 1, 2, 1, 0]))
  })

  it('should filter correctly by mutationKey', async () => {
    const isMutatings: number[] = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating(['mutation1'])
      isMutatings.push(isMutating)
      return null
    }

    function Page() {
      const { mutate: mutate1 } = useMutation(['mutation1'], async () => {
        await sleep(100)
        return 'data'
      })
      const { mutate: mutate2 } = useMutation(['mutation2'], async () => {
        await sleep(100)
        return 'data'
      })

      React.useEffect(() => {
        mutate1()
        mutate2()
      }, [mutate1, mutate2])

      return <IsMutating />
    }

    renderWithClient(queryClient, <Page />)
    await waitFor(() => expect(isMutatings).toEqual([0, 1, 1, 0]))
  })

  it('should filter correctly by predicate', async () => {
    const isMutatings: number[] = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating({
        predicate: (mutation) =>
          mutation.options.mutationKey?.[0] === 'mutation1',
      })
      isMutatings.push(isMutating)
      return null
    }

    function Page() {
      const { mutate: mutate1 } = useMutation(['mutation1'], async () => {
        await sleep(100)
        return 'data'
      })
      const { mutate: mutate2 } = useMutation(['mutation2'], async () => {
        await sleep(100)
        return 'data'
      })

      React.useEffect(() => {
        mutate1()
        mutate2()
      }, [mutate1, mutate2])

      return <IsMutating />
    }

    renderWithClient(queryClient, <Page />)
    await waitFor(() => expect(isMutatings).toEqual([0, 1, 1, 0]))
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
      const [mounted, setMounted] = React.useState(true)
      const { mutate: mutate1 } = useMutation(['mutation1'], async () => {
        await sleep(10)
        return 'data'
      })

      React.useEffect(() => {
        mutate1()
      }, [mutate1])

      return (
        <div>
          <button onClick={() => setMounted(false)}>unmount</button>
          {mounted && <IsMutating />}
        </div>
      )
    }

    const { getByText } = renderWithClient(queryClient, <Page />)
    fireEvent.click(getByText('unmount'))

    // Should not display the console error
    // "Warning: Can't perform a React state update on an unmounted component"

    await sleep(20)
    MutationCacheSpy.mockRestore()
  })

  describe('with custom context', () => {
    it('should return the number of fetching mutations', async () => {
      const context = React.createContext<QueryClient | undefined>(undefined)

      const isMutatings: number[] = []
      const queryClient = new QueryClient()

      function IsMutating() {
        const isMutating = useIsMutating(undefined, { context })
        isMutatings.push(isMutating)
        return null
      }

      function Page() {
        const { mutate: mutate1 } = useMutation(
          ['mutation1'],
          async () => {
            await sleep(150)
            return 'data'
          },
          { context },
        )
        const { mutate: mutate2 } = useMutation(
          ['mutation2'],
          async () => {
            await sleep(50)
            return 'data'
          },
          { context },
        )

        React.useEffect(() => {
          mutate1()
          setActTimeout(() => {
            mutate2()
          }, 50)
        }, [mutate1, mutate2])

        return <IsMutating />
      }

      renderWithClient(queryClient, <Page />, { context })
      await waitFor(() => expect(isMutatings).toEqual([0, 1, 1, 2, 2, 1, 0]))
    })

    it('should throw if the context is not passed to useIsMutating', async () => {
      const context = React.createContext<QueryClient | undefined>(undefined)

      const isMutatings: number[] = []
      const queryClient = new QueryClient()

      function IsMutating() {
        const isMutating = useIsMutating(undefined)
        isMutatings.push(isMutating)
        return null
      }

      function Page() {
        const { mutate } = useMutation(['mutation'], async () => 'data', {
          useErrorBoundary: true,
          context,
        })

        React.useEffect(() => {
          mutate()
        }, [mutate])

        return <IsMutating />
      }

      const rendered = renderWithClient(
        queryClient,
        <ErrorBoundary fallbackRender={() => <div>error boundary</div>}>
          <Page />
        </ErrorBoundary>,
        { context },
      )

      await waitFor(() => rendered.getByText('error boundary'))
    })
  })
})
