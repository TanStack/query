import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createEffect } from 'solid-js'
import { sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useMutationState,
} from '..'

describe('useMutationState', () => {
  it('should return variables after calling mutate', async () => {
    const queryClient = new QueryClient()
    const variables: Array<Array<unknown>> = []
    const mutationKey = ['mutation']

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
        mutationFn: async (input: number) => {
          await sleep(150)
          return 'data' + input
        },
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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => rendered.getByText('data: null'))

    fireEvent.click(rendered.getByRole('button', { name: /mutate/i }))

    await waitFor(() => rendered.getByText('data: data1'))

    expect(variables).toEqual([[], [1], []])
  })
})
