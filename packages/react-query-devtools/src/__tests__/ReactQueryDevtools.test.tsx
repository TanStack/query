import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import type { ReactQueryDevtools as ReactQueryDevtoolsComponent } from '../ReactQueryDevtools'

const mountMock = vi.fn<TanstackQueryDevtools['mount']>()
const unmountMock = vi.fn<TanstackQueryDevtools['unmount']>()
const setClientMock = vi.fn<TanstackQueryDevtools['setClient']>()
const setButtonPositionMock =
  vi.fn<TanstackQueryDevtools['setButtonPosition']>()
const setPositionMock = vi.fn<TanstackQueryDevtools['setPosition']>()
const setInitialIsOpenMock = vi.fn<TanstackQueryDevtools['setInitialIsOpen']>()
const setErrorTypesMock = vi.fn<TanstackQueryDevtools['setErrorTypes']>()
const setThemeMock = vi.fn<TanstackQueryDevtools['setTheme']>()

// oxlint-disable-next-line vitest/prefer-import-in-mock -- the mocked devtools classes have '#private' fields, and this environment cannot load the real Solid module
vi.mock('@tanstack/query-devtools', () => ({
  TanstackQueryDevtools: vi.fn<(this: TanstackQueryDevtools) => void>(function (
    this: TanstackQueryDevtools,
  ) {
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
  let ReactQueryDevtools: typeof ReactQueryDevtoolsComponent
  let queryClient: QueryClient

  beforeEach(async () => {
    vi.clearAllMocks()
    ;({ ReactQueryDevtools } = await import('../ReactQueryDevtools'))
    queryClient = new QueryClient()
  })

  it('should throw an error if no query client has been set', () => {
    expect(() => render(<ReactQueryDevtools />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', () => {
    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools />
        </QueryClientProvider>,
      ),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalledWith(expect.any(HTMLDivElement))
  })

  it('should not throw an error if query client is provided via props', () => {
    expect(() =>
      render(<ReactQueryDevtools client={queryClient} />),
    ).not.toThrow()
    expect(mountMock).toHaveBeenCalledWith(expect.any(HTMLDivElement))
  })

  it('should forward "buttonPosition" to the devtools instance', () => {
    render(
      <ReactQueryDevtools client={queryClient} buttonPosition="top-left" />,
    )

    expect(setButtonPositionMock).toHaveBeenCalledWith('top-left')
  })

  it('should forward "position" to the devtools instance', () => {
    render(<ReactQueryDevtools client={queryClient} position="left" />)

    expect(setPositionMock).toHaveBeenCalledWith('left')
  })

  it('should forward "initialIsOpen" to the devtools instance', () => {
    render(<ReactQueryDevtools client={queryClient} initialIsOpen={true} />)

    expect(setInitialIsOpenMock).toHaveBeenCalledWith(true)
  })

  it('should default "initialIsOpen" to "false" when the prop is omitted', () => {
    render(<ReactQueryDevtools client={queryClient} />)

    expect(setInitialIsOpenMock).toHaveBeenCalledWith(false)
  })

  it('should forward "errorTypes" to the devtools instance', () => {
    const errorTypes = [
      { name: 'Network', initializer: () => new Error('Network') },
    ]

    render(<ReactQueryDevtools client={queryClient} errorTypes={errorTypes} />)

    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })

  it('should default "errorTypes" to an empty array when the prop is omitted', () => {
    render(<ReactQueryDevtools client={queryClient} />)

    expect(setErrorTypesMock).toHaveBeenCalledWith([])
  })

  it('should forward "theme" to the devtools instance', () => {
    render(<ReactQueryDevtools client={queryClient} theme="dark" />)

    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('should forward the resolved "QueryClient" via "setClient"', () => {
    render(<ReactQueryDevtools client={queryClient} />)

    expect(setClientMock).toHaveBeenCalledWith(queryClient)
  })

  it('should forward "styleNonce" to the devtools constructor', () => {
    render(<ReactQueryDevtools client={queryClient} styleNonce="abc" />)

    expect(TanstackQueryDevtools).toHaveBeenCalledWith(
      expect.objectContaining({ styleNonce: 'abc' }),
    )
  })

  it('should forward "shadowDOMTarget" to the devtools constructor', () => {
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

  it('should forward "hideDisabledQueries" to the devtools constructor', () => {
    render(
      <ReactQueryDevtools client={queryClient} hideDisabledQueries={true} />,
    )

    expect(TanstackQueryDevtools).toHaveBeenCalledWith(
      expect.objectContaining({ hideDisabledQueries: true }),
    )
  })

  it('should create the devtools instance only once across re-renders', () => {
    const { rerender } = render(
      <ReactQueryDevtools client={queryClient} position="bottom" />,
    )

    rerender(<ReactQueryDevtools client={queryClient} position="top" />)

    expect(TanstackQueryDevtools).toHaveBeenCalledTimes(1)
  })

  it('should forward a "buttonPosition" change to the devtools instance after mount', () => {
    const { rerender } = render(
      <ReactQueryDevtools client={queryClient} buttonPosition="bottom-right" />,
    )
    setButtonPositionMock.mockClear()

    rerender(
      <ReactQueryDevtools client={queryClient} buttonPosition="top-left" />,
    )

    expect(setButtonPositionMock).toHaveBeenCalledWith('top-left')
  })

  it('should forward a "position" change to the devtools instance after mount', () => {
    const { rerender } = render(
      <ReactQueryDevtools client={queryClient} position="bottom" />,
    )
    setPositionMock.mockClear()

    rerender(<ReactQueryDevtools client={queryClient} position="top" />)

    expect(setPositionMock).toHaveBeenCalledWith('top')
  })

  it('should forward an "initialIsOpen" change to the devtools instance after mount', () => {
    const { rerender } = render(
      <ReactQueryDevtools client={queryClient} initialIsOpen={false} />,
    )
    setInitialIsOpenMock.mockClear()

    rerender(<ReactQueryDevtools client={queryClient} initialIsOpen={true} />)

    expect(setInitialIsOpenMock).toHaveBeenCalledWith(true)
  })

  it('should forward an "errorTypes" change to the devtools instance after mount', () => {
    const { rerender } = render(
      <ReactQueryDevtools client={queryClient} errorTypes={[]} />,
    )
    setErrorTypesMock.mockClear()

    const errorTypes = [
      { name: 'Network', initializer: () => new Error('Network') },
    ]
    rerender(
      <ReactQueryDevtools client={queryClient} errorTypes={errorTypes} />,
    )

    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })

  it('should forward a "theme" change to the devtools instance after mount', () => {
    const { rerender } = render(
      <ReactQueryDevtools client={queryClient} theme="light" />,
    )
    setThemeMock.mockClear()

    rerender(<ReactQueryDevtools client={queryClient} theme="dark" />)

    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('should call "unmount" on the devtools instance when the component unmounts', () => {
    const { unmount } = render(<ReactQueryDevtools client={queryClient} />)
    unmount()

    expect(unmountMock).toHaveBeenCalledWith()
  })

  it('should return null in non-development environments', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()

    try {
      const { ReactQueryDevtools: ProductionDevtools } = await import('..')
      expect(ProductionDevtools({})).toBeNull()
    } finally {
      vi.resetModules()
    }
  })
})
