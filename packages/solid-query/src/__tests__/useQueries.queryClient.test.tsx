import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSignal } from 'solid-js'
import { fireEvent } from '@solidjs/testing-library'
import { QueryClient, useQueries } from '..'
import { renderWithClient } from './utils'

describe('useQueries custom queryClient accessor', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should fetch through the current queryClient after the accessor changes', async () => {
    vi.useFakeTimers()

    const queryClient1 = new QueryClient()
    const queryClient2 = new QueryClient()
    const queryKey = ['custom-client'] as const
    const [client, setClient] = createSignal(queryClient1)

    queryClient1.setQueryDefaults(queryKey, {
      queryFn: () => Promise.resolve('client-1'),
    })
    queryClient2.setQueryDefaults(queryKey, {
      queryFn: () => Promise.resolve('client-2'),
    })

    function Page() {
      const queries = useQueries(
        () => ({
          queries: [{ queryKey }],
        }),
        client,
      )

      return (
        <>
          <div data-testid="data">{String(queries[0]?.data ?? 'pending')}</div>
          <button onClick={() => setClient(queryClient2)}>switch client</button>
        </>
      )
    }

    const rendered = renderWithClient(queryClient1, () => <Page />)

    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByTestId('data').textContent).toBe('client-1')
    expect(queryClient1.getQueryData(queryKey)).toBe('client-1')
    expect(queryClient2.getQueryData(queryKey)).toBeUndefined()

    fireEvent.click(rendered.getByRole('button', { name: 'switch client' }))
    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByTestId('data').textContent).toBe('client-2')
    expect(queryClient1.getQueryData(queryKey)).toBe('client-1')
    expect(queryClient2.getQueryData(queryKey)).toBe('client-2')

    rendered.unmount()
    queryClient1.clear()
    queryClient2.clear()
  })
})
