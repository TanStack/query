import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/preact'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'

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
  beforeEach(() => {
    vi.clearAllMocks()
  })

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
    expect(mountMock).toHaveBeenCalled()
  })

  it('should not throw an error if query client is provided via props', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    expect(() =>
      render(<PreactQueryDevtoolsPanel client={queryClient} />),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalled()
  })

  it('should forward "onClose" to the devtools instance', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()
    const onClose = vi.fn()

    render(<PreactQueryDevtoolsPanel client={queryClient} onClose={onClose} />)

    expect(setOnCloseMock).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should default "onClose" to a no-op function when the prop is omitted', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtoolsPanel client={queryClient} />)

    expect(setOnCloseMock).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should forward "errorTypes" to the devtools instance', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()
    const errorTypes = [
      { name: 'Network', initializer: () => new Error('Network') },
    ]

    render(
      <PreactQueryDevtoolsPanel client={queryClient} errorTypes={errorTypes} />,
    )

    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })

  it('should default "errorTypes" to an empty array when the prop is omitted', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtoolsPanel client={queryClient} />)

    expect(setErrorTypesMock).toHaveBeenCalledWith([])
  })

  it('should forward "theme" to the devtools instance', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtoolsPanel client={queryClient} theme="dark" />)

    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('should forward the resolved "QueryClient" via "setClient"', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtoolsPanel client={queryClient} />)

    expect(setClientMock).toHaveBeenCalledWith(queryClient)
  })

  it('should forward "styleNonce" to the devtools constructor', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(<PreactQueryDevtoolsPanel client={queryClient} styleNonce="abc" />)

    expect(TanstackQueryDevtoolsPanel).toHaveBeenCalledWith(
      expect.objectContaining({ styleNonce: 'abc' }),
    )
  })

  it('should forward "shadowDOMTarget" to the devtools constructor', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()
    const shadowDOMTarget = document
      .createElement('div')
      .attachShadow({ mode: 'open' })

    render(
      <PreactQueryDevtoolsPanel
        client={queryClient}
        shadowDOMTarget={shadowDOMTarget}
      />,
    )

    expect(TanstackQueryDevtoolsPanel).toHaveBeenCalledWith(
      expect.objectContaining({ shadowDOMTarget }),
    )
  })

  it('should forward "hideDisabledQueries" to the devtools constructor', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(
      <PreactQueryDevtoolsPanel
        client={queryClient}
        hideDisabledQueries={true}
      />,
    )

    expect(TanstackQueryDevtoolsPanel).toHaveBeenCalledWith(
      expect.objectContaining({ hideDisabledQueries: true }),
    )
  })

  it('should preserve the default container height when "style" omits "height"', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    const { container } = render(
      <PreactQueryDevtoolsPanel
        client={queryClient}
        style={{ width: '300px' }}
      />,
    )

    expect(container.querySelector('.tsqd-parent-container')).toHaveStyle({
      height: '500px',
      width: '300px',
    })
  })

  it('should let "style" override the default container height on the rendered element', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    const { container } = render(
      <PreactQueryDevtoolsPanel
        client={queryClient}
        style={{ width: '300px', height: '300px' }}
      />,
    )

    expect(container.querySelector('.tsqd-parent-container')).toHaveStyle({
      height: '300px',
      width: '300px',
    })
  })

  it('should call "unmount" on the devtools instance when the component unmounts', async () => {
    const { PreactQueryDevtoolsPanel } =
      await import('../PreactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    const { unmount } = render(
      <PreactQueryDevtoolsPanel client={queryClient} />,
    )
    unmount()

    expect(unmountMock).toHaveBeenCalled()
  })

  it('should return null in non-development environments', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()

    try {
      const { PreactQueryDevtoolsPanel } = await import('..')
      expect(PreactQueryDevtoolsPanel({})).toBeNull()
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})
