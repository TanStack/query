import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/preact'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import type { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'

const mountMock = vi.fn()
const unmountMock = vi.fn()
const setClientMock = vi.fn()
const setOnCloseMock = vi.fn()
const setErrorTypesMock = vi.fn()
const setThemeMock = vi.fn()

vi.mock('@tanstack/query-devtools', () => ({
  TanstackQueryDevtoolsPanel: vi.fn(function (
    this: TanstackQueryDevtoolsPanel,
  ) {
    this.mount = mountMock
    this.unmount = unmountMock
    this.setClient = setClientMock
    this.setOnClose = setOnCloseMock
    this.setErrorTypes = setErrorTypesMock
    this.setTheme = setThemeMock
  }),
}))

describe('PreactQueryDevtoolsPanel', () => {
  it('should throw an error if no query client has been set', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')

    expect(() => render(<PreactQueryDevtoolsPanel />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <PreactQueryDevtoolsPanel />
        </QueryClientProvider>,
      ),
    ).not.toThrow()
  })

  it('should not throw an error if query client is provided via props', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    expect(() =>
      render(<PreactQueryDevtoolsPanel client={queryClient} />),
    ).not.toThrow()
  })

  it('should return null in non-development environments', async () => {
    const { PreactQueryDevtoolsPanel } = await import('..')

    expect(process.env.NODE_ENV).not.toBe('development')
    expect(PreactQueryDevtoolsPanel({})).toBeNull()
  })
})
