import { describe, expect, expectTypeOf, it } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { useIsMutating, useMutationState } from '../useMutationState'
import { useMutation } from '../useMutation'
import {
  createQueryClient,
  doNotExecute,
  renderWithClient,
  setActTimeout,
  sleep,
} from './utils'
import type { MutationState, MutationStatus } from '@tanstack/query-core'

describe('useIsMutating', () => {
  it('should return the number of fetching mutations', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating()
      isMutatingArray.push(isMutating)
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
    await waitFor(() => expect(isMutatingArray).toEqual([0, 1, 2, 1, 0]))
  })

  it('should filter correctly by mutationKey', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating({ mutationKey: ['mutation1'] })
      isMutatingArray.push(isMutating)
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
    await waitFor(() => expect(isMutatingArray).toEqual([0, 1, 0]))
  })

  it('should filter correctly by predicate', async () => {
    const isMutatingArray: Array<number> = []
    const queryClient = createQueryClient()

    function IsMutating() {
      const isMutating = useIsMutating({
        predicate: (mutation) =>
          mutation.options.mutationKey?.[0] === 'mutation1',
      })
      isMutatingArray.push(isMutating)
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
    await waitFor(() => expect(isMutatingArray).toEqual([0, 1, 0]))
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
  describe('types', () => {
    it('should default to QueryState', () => {
      doNotExecute(() => {
        const result = useMutationState({
          filters: { status: 'pending' },
        })

        expectTypeOf(result).toEqualTypeOf<Array<MutationState>>()
      })
    })
    it('should infer with select', () => {
      doNotExecute(() => {
        const result = useMutationState({
          filters: { status: 'pending' },
          select: (mutation) => mutation.state.status,
        })

        expectTypeOf(result).toEqualTypeOf<Array<MutationStatus>>()
      })
    })
  })
  it('should return variables after calling mutate', async () => {
    const queryClient = createQueryClient()
    const variables: Array<Array<unknown>> = []
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
})
