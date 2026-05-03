import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

describe('ReactQueryDevtools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw an error if no query client has been set', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')

    expect(() => render(<ReactQueryDevtools />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools />
        </QueryClientProvider>,
      ),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalled()
  })

  it('should not throw an error if query client is provided via props', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    expect(() =>
      render(<ReactQueryDevtools client={queryClient} />),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalled()
  })

  it('should return null in non-development environments', async () => {
    const { ReactQueryDevtools } = await import('..')

    expect(process.env.NODE_ENV).not.toBe('development')
    expect(ReactQueryDevtools({})).toBeNull()
  })
})
