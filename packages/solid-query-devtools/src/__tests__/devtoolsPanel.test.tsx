import { describe, expect, it } from 'vitest'
import { render } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import SolidQueryDevtoolsPanel from '../devtoolsPanel'

describe('SolidQueryDevtoolsPanel', () => {
  it('should throw an error if no query client has been set', () => {
    expect(() => render(() => <SolidQueryDevtoolsPanel />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', () => {
    const queryClient = new QueryClient()

    expect(() =>
      render(() => (
        <QueryClientProvider client={queryClient}>
          <SolidQueryDevtoolsPanel />
        </QueryClientProvider>
      )),
    ).not.toThrow()
  })

  it('should not throw an error if query client is provided via props', () => {
    const queryClient = new QueryClient()

    expect(() =>
      render(() => <SolidQueryDevtoolsPanel client={queryClient} />),
    ).not.toThrow()
  })
})
