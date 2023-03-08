import { fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { useIsMutating, useMutationState } from '../useMutationState'
import { useMutation } from '../useMutation'
import {
  createQueryClient,
  renderWithClient,
  setActTimeout,
  sleep,
} from './utils'
import * as MutationCacheModule from '../../../query-core/src/mutationCache'
import { vi } from 'vitest'
// import { screen } from 'solid-testing-library'

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
      const { mutate: mutate1 } = useMutation({
        mutationKey: ['mutation1'],
        mutationFn: async () => {
          await sleep(150)
          return 'data'
        },
      })
      const { mutate: mutate2 } = useMutation({
        mutationKey: ['mutation2'],
        mutationFn: async () => {
          await sleep(50)
          return 'data'
        },
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
      const isMutating = useIsMutating({ mutationKey: ['mutation1'] })
      isMutatings.push(isMutating)
      return null
    }

    function Page() {
      const { mutate: mutate1 } = useMutation({
        mutationKey: ['mutation1'],
        mutationFn: async () => {
          await sleep(100)
          return 'data'
        },
      })
      const { mutate: mutate2 } = useMutation({
        mutationKey: ['mutation2'],
        mutationFn: async () => {
          await sleep(100)
          return 'data'
        },
      })

      React.useEffect(() => {
        mutate1()
        mutate2()
      }, [mutate1, mutate2])

      return <IsMutating />
    }

    renderWithClient(queryClient, <Page />)
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
      isMutatings.push(isMutating)
      return null
    }

    function Page() {
      const { mutate: mutate1 } = useMutation({
        mutationKey: ['mutation1'],
        mutationFn: async () => {
          await sleep(100)
          return 'data'
        },
      })
      const { mutate: mutate2 } = useMutation({
        mutationKey: ['mutation2'],
        mutationFn: async () => {
          await sleep(100)
          return 'data'
        },
      })

      React.useEffect(() => {
        mutate1()
        mutate2()
      }, [mutate1, mutate2])

      return <IsMutating />
    }

    renderWithClient(queryClient, <Page />)
    await waitFor(() => expect(isMutatings).toEqual([0, 1, 0]))
  })

  it('should use provided custom queryClient', async () => {
    const queryClient = createQueryClient()

    function Page() {
      const isMutating = useIsMutating({}, queryClient)
      const { mutate } = useMutation(
        {
          mutationKey: ['mutation1'],
          mutationFn: async () => {
            await sleep(10)
            return 'data'
          },
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

    const rendered = render(<Page></Page>)

    await waitFor(() => rendered.getByText('mutating: 1'))
  })
})

describe('useMutationState', () => {
  it('should return variables after calling mutate', async () => {
    const queryClient = createQueryClient()
    const variables: unknown[][] = []
    const mutationKey = ['mutation']

    function Variables() {
      variables.push(
        useMutationState({
          filters: { mutationKey, status: 'pending' },
          select: (mutation) => mutation.state.variables,
        }),
      )

      return null
    }

    function Mutate() {
      const { mutate, data } = useMutation({
        mutationKey,
        mutationFn: async (input: number) => {
          await sleep(150)
          return 'data' + input
        },
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

    await waitFor(() => rendered.getByText('data: null'))

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await waitFor(() => rendered.getByText('data: data1'))

    expect(variables).toEqual([[], [1], []])
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

    const MutationCacheSpy = vi
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
      const { mutate: mutate1 } = useMutation({
        mutationKey: ['mutation1'],
        mutationFn: async () => {
          await sleep(10)
          return 'data'
        },
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
})
