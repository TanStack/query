import { describe, expect, it } from 'vitest'
import { createSignal } from 'solid-js'
import { fireEvent } from '@solidjs/testing-library'
import { QueryClient, useMutationState } from '..'
import { renderWithClient } from './utils'

describe('useMutationState custom queryClient accessor', () => {
  it('should show the current queryClient mutation cache after the accessor changes', async () => {
    const queryClient1 = new QueryClient()
    const queryClient2 = new QueryClient()
    const mutationKey = ['custom-client'] as const

    await queryClient1
      .getMutationCache()
      .build(queryClient1, {
        mutationKey,
        mutationFn: () => Promise.resolve('client-1'),
      })
      .execute(undefined)

    await queryClient2
      .getMutationCache()
      .build(queryClient2, {
        mutationKey,
        mutationFn: () => Promise.resolve('client-2'),
      })
      .execute(undefined)

    const [client, setClient] = createSignal(queryClient1)

    function Page() {
      const data = useMutationState(
        () => ({
          filters: { mutationKey },
          select: (mutation) => mutation.state.data,
        }),
        client,
      )

      return (
        <>
          <div data-testid="data">{String(data()[0])}</div>
          <button onClick={() => setClient(queryClient2)}>switch client</button>
        </>
      )
    }

    const rendered = renderWithClient(queryClient1, () => <Page />)

    expect(rendered.getByTestId('data').textContent).toBe('client-1')

    fireEvent.click(rendered.getByRole('button', { name: 'switch client' }))

    expect(rendered.getByTestId('data').textContent).toBe('client-2')

    rendered.unmount()
    queryClient1.clear()
    queryClient2.clear()
  })
})
