import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import type { ReactQueryDevtoolsPanel as ReactQueryDevtoolsPanelComponent } from '../ReactQueryDevtoolsPanel'

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
  let ReactQueryDevtoolsPanel: typeof ReactQueryDevtoolsPanelComponent
  let queryClient: QueryClient

  beforeEach(async () => {
    vi.clearAllMocks()
    ;({ ReactQueryDevtoolsPanel } = await import('../ReactQueryDevtoolsPanel'))
    queryClient = new QueryClient()
  })

  it('should throw an error if no query client has been set', () => {
    expect(() => render(<ReactQueryDevtoolsPanel />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', () => {
    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtoolsPanel />
        </QueryClientProvider>,
      ),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalled()
  })

  it('should not throw an error if query client is provided via props', () => {
    expect(() =>
      render(<ReactQueryDevtoolsPanel client={queryClient} />),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalled()
  })

  it('should forward "onClose" to the devtools instance', () => {
    const onClose = vi.fn()

    render(<ReactQueryDevtoolsPanel client={queryClient} onClose={onClose} />)

    expect(setOnCloseMock).toHaveBeenCalledWith(onClose)
  })

  it('should default "onClose" to a no-op function when the prop is omitted', () => {
    render(<ReactQueryDevtoolsPanel client={queryClient} />)

    const forwarded = setOnCloseMock.mock.calls[0]?.[0]
    expect(forwarded).toBeInstanceOf(Function)
    expect(forwarded()).toBeUndefined()
  })

  it('should forward "errorTypes" to the devtools instance', () => {
    const errorTypes = [
      { name: 'Network', initializer: () => new Error('Network') },
    ]

    render(
      <ReactQueryDevtoolsPanel client={queryClient} errorTypes={errorTypes} />,
    )

    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })

  it('should default "errorTypes" to an empty array when the prop is omitted', () => {
    render(<ReactQueryDevtoolsPanel client={queryClient} />)

    expect(setErrorTypesMock).toHaveBeenCalledWith([])
  })

  it('should forward "theme" to the devtools instance', () => {
    render(<ReactQueryDevtoolsPanel client={queryClient} theme="dark" />)

    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('should forward the resolved "QueryClient" via "setClient"', () => {
    render(<ReactQueryDevtoolsPanel client={queryClient} />)

    expect(setClientMock).toHaveBeenCalledWith(queryClient)
  })

  it('should forward "styleNonce" to the devtools constructor', () => {
    render(<ReactQueryDevtoolsPanel client={queryClient} styleNonce="abc" />)

    expect(TanstackQueryDevtoolsPanel).toHaveBeenCalledWith(
      expect.objectContaining({ styleNonce: 'abc' }),
    )
  })

  it('should forward "shadowDOMTarget" to the devtools constructor', () => {
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

  it('should forward "hideDisabledQueries" to the devtools constructor', () => {
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

  it('should preserve the default container height when "style" omits "height"', () => {
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

  it('should let "style" override the default container height on the rendered element', () => {
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

  it('should call "unmount" on the devtools instance when the component unmounts', () => {
    const { unmount } = render(<ReactQueryDevtoolsPanel client={queryClient} />)
    unmount()

    expect(unmountMock).toHaveBeenCalled()
  })

  it('should return null in non-development environments', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()

    try {
      const { ReactQueryDevtoolsPanel: ProductionDevtoolsPanel } =
        await import('..')
      expect(ProductionDevtoolsPanel({})).toBeNull()
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})
