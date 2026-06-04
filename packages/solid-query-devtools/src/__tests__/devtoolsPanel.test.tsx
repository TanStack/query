import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import SolidQueryDevtoolsPanel from '../devtoolsPanel'

describe('SolidQueryDevtoolsPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should throw an error if no query client has been set', () => {
    expect(() => render(() => <SolidQueryDevtoolsPanel />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', () => {
    const queryClient = new QueryClient()

    expect(() =>
      render(() => (
        <QueryClientProvider client={queryClient}>
          <SolidQueryDevtoolsPanel />
        </QueryClientProvider>
      )),
    ).not.toThrow()
  })

  it('should not throw an error if query client is provided via props', () => {
    const queryClient = new QueryClient()

    expect(() =>
      render(() => <SolidQueryDevtoolsPanel client={queryClient} />),
    ).not.toThrow()
  })

  it('should forward "onClose" to the devtools instance', () => {
    const setOnClose = vi.spyOn(
      TanstackQueryDevtoolsPanel.prototype,
      'setOnClose',
    )
    const queryClient = new QueryClient()
    const onClose = vi.fn()

    render(() => (
      <SolidQueryDevtoolsPanel client={queryClient} onClose={onClose} />
    ))

    expect(setOnClose).toHaveBeenCalledWith(onClose)
  })

  it('should default "onClose" to a no-op function when the prop is omitted', () => {
    const setOnClose = vi.spyOn(
      TanstackQueryDevtoolsPanel.prototype,
      'setOnClose',
    )
    const queryClient = new QueryClient()

    render(() => <SolidQueryDevtoolsPanel client={queryClient} />)

    expect(setOnClose).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should forward "errorTypes" to the devtools instance', () => {
    const setErrorTypes = vi.spyOn(
      TanstackQueryDevtoolsPanel.prototype,
      'setErrorTypes',
    )
    const queryClient = new QueryClient()
    const errorTypes = [
      { name: 'Network', initializer: () => new Error('Network') },
    ]

    render(() => (
      <SolidQueryDevtoolsPanel client={queryClient} errorTypes={errorTypes} />
    ))

    expect(setErrorTypes).toHaveBeenCalledWith(errorTypes)
  })

  it('should default "errorTypes" to an empty array when the prop is omitted', () => {
    const setErrorTypes = vi.spyOn(
      TanstackQueryDevtoolsPanel.prototype,
      'setErrorTypes',
    )
    const queryClient = new QueryClient()

    render(() => <SolidQueryDevtoolsPanel client={queryClient} />)

    expect(setErrorTypes).toHaveBeenCalledWith([])
  })

  it('should forward "theme" to the devtools instance', () => {
    const setTheme = vi.spyOn(TanstackQueryDevtoolsPanel.prototype, 'setTheme')
    const queryClient = new QueryClient()

    render(() => <SolidQueryDevtoolsPanel client={queryClient} theme="dark" />)

    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('should default "theme" to "system" when the prop is omitted', () => {
    const setTheme = vi.spyOn(TanstackQueryDevtoolsPanel.prototype, 'setTheme')
    const queryClient = new QueryClient()

    render(() => <SolidQueryDevtoolsPanel client={queryClient} />)

    expect(setTheme).toHaveBeenCalledWith('system')
  })

  it('should forward the resolved "QueryClient" via "setClient"', () => {
    const setClient = vi.spyOn(
      TanstackQueryDevtoolsPanel.prototype,
      'setClient',
    )
    const queryClient = new QueryClient()

    render(() => <SolidQueryDevtoolsPanel client={queryClient} />)

    expect(setClient).toHaveBeenCalledWith(queryClient)
  })

  it('should preserve the default container height when "style" omits "height"', () => {
    const queryClient = new QueryClient()

    const { container } = render(() => (
      <SolidQueryDevtoolsPanel
        client={queryClient}
        style={{ width: '300px' }}
      />
    ))

    expect(container.querySelector('.tsqd-parent-container')).toHaveStyle({
      height: '500px',
      width: '300px',
    })
  })

  it('should let "style" override the default container height on the rendered element', () => {
    const queryClient = new QueryClient()

    const { container } = render(() => (
      <SolidQueryDevtoolsPanel
        client={queryClient}
        style={{ width: '300px', height: '300px' }}
      />
    ))

    expect(container.querySelector('.tsqd-parent-container')).toHaveStyle({
      height: '300px',
      width: '300px',
    })
  })

  it('should call "unmount" on the devtools instance when the component unmounts', () => {
    const unmount = vi.spyOn(TanstackQueryDevtoolsPanel.prototype, 'unmount')
    const queryClient = new QueryClient()

    const { unmount: unmountComponent } = render(() => (
      <SolidQueryDevtoolsPanel client={queryClient} />
    ))
    unmountComponent()

    expect(unmount).toHaveBeenCalled()
  })

  it('should return null in non-development environments', async () => {
    vi.doMock('solid-js/web', async (importOriginal) => {
      const actual = await importOriginal()
      return Object.assign({}, actual, { isDev: false })
    })
    vi.resetModules()

    try {
      const { SolidQueryDevtoolsPanel: ProductionDevtoolsPanel } =
        await import('..')
      expect(ProductionDevtoolsPanel({})).toBeNull()
    } finally {
      vi.doUnmock('solid-js/web')
      vi.resetModules()
    }
  })
})
