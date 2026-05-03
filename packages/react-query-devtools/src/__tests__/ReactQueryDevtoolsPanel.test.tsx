import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

describe('ReactQueryDevtoolsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw an error if no query client has been set', async () => {
    const { ReactQueryDevtoolsPanel } = await import(
      '../ReactQueryDevtoolsPanel'
    )

    expect(() => render(<ReactQueryDevtoolsPanel />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', async () => {
    const { ReactQueryDevtoolsPanel } = await import(
      '../ReactQueryDevtoolsPanel'
    )
    const queryClient = new QueryClient()

    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtoolsPanel />
        </QueryClientProvider>,
      ),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalled()
  })

  it('should not throw an error if query client is provided via props', async () => {
    const { ReactQueryDevtoolsPanel } = await import(
      '../ReactQueryDevtoolsPanel'
    )
    const queryClient = new QueryClient()

    expect(() =>
      render(<ReactQueryDevtoolsPanel client={queryClient} />),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalled()
  })

  it('should return null in non-development environments', async () => {
    const { ReactQueryDevtoolsPanel } = await import('..')

    expect(process.env.NODE_ENV).not.toBe('development')
    expect(ReactQueryDevtoolsPanel({})).toBeNull()
  })
})
