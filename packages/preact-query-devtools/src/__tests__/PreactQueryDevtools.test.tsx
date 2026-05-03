import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/preact'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import type { TanstackQueryDevtools } from '@tanstack/query-devtools'

const mountMock = vi.fn()
const unmountMock = vi.fn()
const setClientMock = vi.fn()
const setButtonPositionMock = vi.fn()
const setPositionMock = vi.fn()
const setInitialIsOpenMock = vi.fn()
const setErrorTypesMock = vi.fn()
const setThemeMock = vi.fn()

vi.mock('@tanstack/query-devtools', () => ({
  TanstackQueryDevtools: vi.fn(function (this: TanstackQueryDevtools) {
    this.mount = mountMock
    this.unmount = unmountMock
    this.setClient = setClientMock
    this.setButtonPosition = setButtonPositionMock
    this.setPosition = setPositionMock
    this.setInitialIsOpen = setInitialIsOpenMock
    this.setErrorTypes = setErrorTypesMock
    this.setTheme = setThemeMock
  }),
}))

describe('PreactQueryDevtools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw an error if no query client has been set', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')

    expect(() => render(<PreactQueryDevtools />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <PreactQueryDevtools />
        </QueryClientProvider>,
      ),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalled()
  })

  it('should not throw an error if query client is provided via props', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    expect(() =>
      render(<PreactQueryDevtools client={queryClient} />),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalled()
  })

  it('should return null in non-development environments', async () => {
    const { PreactQueryDevtools } = await import('..')

    expect(process.env.NODE_ENV).not.toBe('development')
    expect(PreactQueryDevtools({})).toBeNull()
  })
})
