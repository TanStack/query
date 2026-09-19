import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSignal } from 'solid-js'
import { fireEvent, render } from '@solidjs/testing-library'
import { QueryClient, useMutation } from '..'

describe('useMutation custom queryClient accessor', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should use the current queryClient after the accessor changes', async () => {
    vi.useFakeTimers()

    const queryClient1 = new QueryClient()
    const queryClient2 = new QueryClient()
    const mutationKey = ['custom-client'] as const
    const [client, setClient] = createSignal(queryClient1)

    queryClient1.setMutationDefaults(mutationKey, {
      mutationFn: () => Promise.resolve('client-1'),
    })
    queryClient2.setMutationDefaults(mutationKey, {
      mutationFn: () => Promise.resolve('client-2'),
    })

    function Page() {
      const mutation = useMutation<string, Error, void>(
        () => ({ mutationKey }),
        client,
      )

      return (
        <>
          <div data-testid="data">{mutation.data ?? 'idle'}</div>
          <button onClick={() => mutation.mutate()}>mutate</button>
          <button onClick={() => setClient(queryClient2)}>switch client</button>
        </>
      )
    }

    const rendered = render(() => <Page />)

    fireEvent.click(rendered.getByRole('button', { name: 'mutate' }))
    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByTestId('data').textContent).toBe('client-1')
    expect(queryClient1.getMutationCache().getAll()).toHaveLength(1)
    expect(queryClient2.getMutationCache().getAll()).toHaveLength(0)

    fireEvent.click(rendered.getByRole('button', { name: 'switch client' }))

    expect(rendered.getByTestId('data').textContent).toBe('idle')

    fireEvent.click(rendered.getByRole('button', { name: 'mutate' }))
    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByTestId('data').textContent).toBe('client-2')
    expect(queryClient1.getMutationCache().getAll()).toHaveLength(1)
    expect(queryClient2.getMutationCache().getAll()).toHaveLength(1)

    rendered.unmount()
    queryClient1.clear()
    queryClient2.clear()
  })
})
