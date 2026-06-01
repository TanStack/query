import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

describe('ReactQueryDevtoolsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw an error if no query client has been set', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')

    expect(() => render(<ReactQueryDevtoolsPanel />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
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
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    expect(() =>
      render(<ReactQueryDevtoolsPanel client={queryClient} />),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalled()
  })

  it('should forward "onClose" to the devtools instance', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()
    const onClose = vi.fn()

    render(<ReactQueryDevtoolsPanel client={queryClient} onClose={onClose} />)

    expect(setOnCloseMock).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should default "onClose" to a no-op function when the prop is omitted', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtoolsPanel client={queryClient} />)

    expect(setOnCloseMock).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should forward "errorTypes" to the devtools instance', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()
    const errorTypes = [
      { name: 'Network', initializer: () => new Error('Network') },
    ]

    render(
      <ReactQueryDevtoolsPanel client={queryClient} errorTypes={errorTypes} />,
    )

    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })

  it('should default "errorTypes" to an empty array when the prop is omitted', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtoolsPanel client={queryClient} />)

    expect(setErrorTypesMock).toHaveBeenCalledWith([])
  })

  it('should forward "theme" to the devtools instance', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtoolsPanel client={queryClient} theme="dark" />)

    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('should forward the resolved "QueryClient" via "setClient"', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtoolsPanel client={queryClient} />)

    expect(setClientMock).toHaveBeenCalledWith(queryClient)
  })

  it('should forward "styleNonce" to the devtools constructor', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(<ReactQueryDevtoolsPanel client={queryClient} styleNonce="abc" />)

    expect(TanstackQueryDevtoolsPanel).toHaveBeenCalledWith(
      expect.objectContaining({ styleNonce: 'abc' }),
    )
  })

  it('should forward "shadowDOMTarget" to the devtools constructor', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()
    const shadowDOMTarget = document
      .createElement('div')
      .attachShadow({ mode: 'open' })

    render(
      <ReactQueryDevtoolsPanel
        client={queryClient}
        shadowDOMTarget={shadowDOMTarget}
      />,
    )

    expect(TanstackQueryDevtoolsPanel).toHaveBeenCalledWith(
      expect.objectContaining({ shadowDOMTarget }),
    )
  })

  it('should forward "hideDisabledQueries" to the devtools constructor', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    render(
      <ReactQueryDevtoolsPanel
        client={queryClient}
        hideDisabledQueries={true}
      />,
    )

    expect(TanstackQueryDevtoolsPanel).toHaveBeenCalledWith(
      expect.objectContaining({ hideDisabledQueries: true }),
    )
  })

  it('should preserve the default container height when "style" omits "height"', async () => {
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    const { container } = render(
      <ReactQueryDevtoolsPanel
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
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    const { container } = render(
      <ReactQueryDevtoolsPanel
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
    const { ReactQueryDevtoolsPanel } =
      await import('../ReactQueryDevtoolsPanel')
    const queryClient = new QueryClient()

    const { unmount } = render(<ReactQueryDevtoolsPanel client={queryClient} />)
    unmount()

    expect(unmountMock).toHaveBeenCalled()
  })

  it('should return null in non-development environments', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()

    try {
      const { ReactQueryDevtoolsPanel } = await import('..')
      expect(ReactQueryDevtoolsPanel({})).toBeNull()
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})
