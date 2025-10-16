import { describe, expect, it } from 'vitest'
import { render } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import SolidQueryDevtools from '../devtools'

describe('SolidQueryDevtools', () => {
  it('should throw an error if no query client has been set', () => {
    expect(() => render(() => <SolidQueryDevtools />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', () => {
    const queryClient = new QueryClient()

    expect(() =>
      render(() => (
        <QueryClientProvider client={queryClient}>
          <SolidQueryDevtools />
        </QueryClientProvider>
      )),
    ).not.toThrow()
  })

  it('should not throw an error if query client is provided via props', () => {
    const queryClient = new QueryClient()

    expect(() =>
      render(() => <SolidQueryDevtools client={queryClient} />),
    ).not.toThrow()
  })
})
