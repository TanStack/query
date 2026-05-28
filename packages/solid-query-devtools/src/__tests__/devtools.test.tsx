import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import SolidQueryDevtools from '../devtools'

describe('SolidQueryDevtools', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('should forward "buttonPosition" to the devtools instance', () => {
    const setButtonPosition = vi.spyOn(
      TanstackQueryDevtools.prototype,
      'setButtonPosition',
    )
    const queryClient = new QueryClient()

    render(() => (
      <SolidQueryDevtools client={queryClient} buttonPosition="top-left" />
    ))

    expect(setButtonPosition).toHaveBeenCalledWith('top-left')
  })

  it('should forward "position" to the devtools instance', () => {
    const setPosition = vi.spyOn(TanstackQueryDevtools.prototype, 'setPosition')
    const queryClient = new QueryClient()

    render(() => <SolidQueryDevtools client={queryClient} position="left" />)

    expect(setPosition).toHaveBeenCalledWith('left')
  })
})
