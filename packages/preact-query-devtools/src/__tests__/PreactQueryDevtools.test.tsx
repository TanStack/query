import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/preact'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
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

  it('should forward "buttonPosition" to the devtools instance', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    render(
      <PreactQueryDevtools client={queryClient} buttonPosition="top-left" />,
    )

    expect(setButtonPositionMock).toHaveBeenCalledWith('top-left')
  })

  it('should forward "position" to the devtools instance', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtools client={queryClient} position="left" />)

    expect(setPositionMock).toHaveBeenCalledWith('left')
  })

  it('should forward "initialIsOpen" to the devtools instance', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtools client={queryClient} initialIsOpen={true} />)

    expect(setInitialIsOpenMock).toHaveBeenCalledWith(true)
  })

  it('should default "initialIsOpen" to "false" when the prop is omitted', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtools client={queryClient} />)

    expect(setInitialIsOpenMock).toHaveBeenCalledWith(false)
  })

  it('should forward "errorTypes" to the devtools instance', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()
    const errorTypes = [
      { name: 'Network', initializer: () => new Error('Network') },
    ]

    render(<PreactQueryDevtools client={queryClient} errorTypes={errorTypes} />)

    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })

  it('should default "errorTypes" to an empty array when the prop is omitted', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtools client={queryClient} />)

    expect(setErrorTypesMock).toHaveBeenCalledWith([])
  })

  it('should forward "theme" to the devtools instance', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtools client={queryClient} theme="dark" />)

    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('should forward the resolved "QueryClient" via "setClient"', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtools client={queryClient} />)

    expect(setClientMock).toHaveBeenCalledWith(queryClient)
  })

  it('should forward "styleNonce" to the devtools constructor', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtools client={queryClient} styleNonce="abc" />)

    expect(TanstackQueryDevtools).toHaveBeenCalledWith(
      expect.objectContaining({ styleNonce: 'abc' }),
    )
  })

  it('should forward "shadowDOMTarget" to the devtools constructor', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()
    const shadowDOMTarget = document
      .createElement('div')
      .attachShadow({ mode: 'open' })

    render(
      <PreactQueryDevtools
        client={queryClient}
        shadowDOMTarget={shadowDOMTarget}
      />,
    )

    expect(TanstackQueryDevtools).toHaveBeenCalledWith(
      expect.objectContaining({ shadowDOMTarget }),
    )
  })

  it('should forward "hideDisabledQueries" to the devtools constructor', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    render(
      <PreactQueryDevtools client={queryClient} hideDisabledQueries={true} />,
    )

    expect(TanstackQueryDevtools).toHaveBeenCalledWith(
      expect.objectContaining({ hideDisabledQueries: true }),
    )
  })

  it('should call "unmount" on the devtools instance when the component unmounts', async () => {
    const { PreactQueryDevtools } = await import('../PreactQueryDevtools')
    const queryClient = new QueryClient()

    const { unmount } = render(<PreactQueryDevtools client={queryClient} />)
    unmount()

    expect(unmountMock).toHaveBeenCalled()
  })

  it('should return null in non-development environments', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()

    try {
      const { PreactQueryDevtools } = await import('..')
      expect(PreactQueryDevtools({})).toBeNull()
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})
