import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'

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

  it('should forward "buttonPosition" to the devtools instance', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    render(
      <ReactQueryDevtools client={queryClient} buttonPosition="top-left" />,
    )

    expect(setButtonPositionMock).toHaveBeenCalledWith('top-left')
  })

  it('should forward "position" to the devtools instance', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtools client={queryClient} position="left" />)

    expect(setPositionMock).toHaveBeenCalledWith('left')
  })

  it('should forward "initialIsOpen" to the devtools instance', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtools client={queryClient} initialIsOpen={true} />)

    expect(setInitialIsOpenMock).toHaveBeenCalledWith(true)
  })

  it('should default "initialIsOpen" to "false" when the prop is omitted', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtools client={queryClient} />)

    expect(setInitialIsOpenMock).toHaveBeenCalledWith(false)
  })

  it('should forward "errorTypes" to the devtools instance', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()
    const errorTypes = [
      { name: 'Network', initializer: () => new Error('Network') },
    ]

    render(<ReactQueryDevtools client={queryClient} errorTypes={errorTypes} />)

    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })

  it('should default "errorTypes" to an empty array when the prop is omitted', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtools client={queryClient} />)

    expect(setErrorTypesMock).toHaveBeenCalledWith([])
  })

  it('should forward "theme" to the devtools instance', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtools client={queryClient} theme="dark" />)

    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('should forward the resolved "QueryClient" via "setClient"', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtools client={queryClient} />)

    expect(setClientMock).toHaveBeenCalledWith(queryClient)
  })

  it('should forward "styleNonce" to the devtools constructor', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtools client={queryClient} styleNonce="abc" />)

    expect(TanstackQueryDevtools).toHaveBeenCalledWith(
      expect.objectContaining({ styleNonce: 'abc' }),
    )
  })

  it('should forward "shadowDOMTarget" to the devtools constructor', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()
    const shadowDOMTarget = document
      .createElement('div')
      .attachShadow({ mode: 'open' })

    render(
      <ReactQueryDevtools
        client={queryClient}
        shadowDOMTarget={shadowDOMTarget}
      />,
    )

    expect(TanstackQueryDevtools).toHaveBeenCalledWith(
      expect.objectContaining({ shadowDOMTarget }),
    )
  })

  it('should forward "hideDisabledQueries" to the devtools constructor', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    render(
      <ReactQueryDevtools client={queryClient} hideDisabledQueries={true} />,
    )

    expect(TanstackQueryDevtools).toHaveBeenCalledWith(
      expect.objectContaining({ hideDisabledQueries: true }),
    )
  })

  it('should call "unmount" on the devtools instance when the component unmounts', async () => {
    const { ReactQueryDevtools } = await import('../ReactQueryDevtools')
    const queryClient = new QueryClient()

    const { unmount } = render(<ReactQueryDevtools client={queryClient} />)
    unmount()

    expect(unmountMock).toHaveBeenCalled()
  })

  it('should return null in non-development environments', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()

    try {
      const { ReactQueryDevtools } = await import('..')
      expect(ReactQueryDevtools({})).toBeNull()
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})
