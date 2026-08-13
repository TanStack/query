import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSignal, flush } from 'solid-js'
import { cleanup, render } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import SolidQueryDevtools from '../devtools'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  Theme,
} from '@tanstack/query-devtools'

describe('SolidQueryDevtools', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    // Mounting the real devtools lazily imports the devtools UI, which is Solid
    // 1 code that cannot resolve under this Solid 2 test setup. These tests only
    // assert what the wrapper forwards to the instance, and the container
    // element is rendered by the wrapper itself, so stub the mount out.
    vi.spyOn(TanstackQueryDevtools.prototype, 'mount').mockImplementation(
      () => {},
    )
    // ...and with nothing really mounted, the real unmount() would throw.
    vi.spyOn(TanstackQueryDevtools.prototype, 'unmount').mockImplementation(
      () => {},
    )
  })

  afterEach(() => {
    // Dispose rendered roots before restoring mocks: disposal calls unmount()
    // on the instance, which must still be the stub from beforeEach.
    cleanup()
    vi.restoreAllMocks()
  })

  it('should throw an error if no query client has been set', () => {
    expect(() => render(() => <SolidQueryDevtools />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', () => {
    expect(() =>
      render(() => (
        <QueryClientProvider client={queryClient}>
          <SolidQueryDevtools />
        </QueryClientProvider>
      )),
    ).not.toThrow()
  })

  it('should not throw an error if query client is provided via props', () => {
    expect(() =>
      render(() => <SolidQueryDevtools client={queryClient} />),
    ).not.toThrow()
  })

  it('should forward "buttonPosition" to the devtools instance', () => {
    const setButtonPosition = vi.spyOn(
      TanstackQueryDevtools.prototype,
      'setButtonPosition',
    )
    render(() => (
      <SolidQueryDevtools client={queryClient} buttonPosition="top-left" />
    ))

    flush()
    expect(setButtonPosition).toHaveBeenCalledWith('top-left')
  })

  it('should forward "position" to the devtools instance', () => {
    const setPosition = vi.spyOn(TanstackQueryDevtools.prototype, 'setPosition')
    render(() => <SolidQueryDevtools client={queryClient} position="left" />)

    flush()
    expect(setPosition).toHaveBeenCalledWith('left')
  })

  it('should forward "initialIsOpen" to the devtools instance', () => {
    const setInitialIsOpen = vi.spyOn(
      TanstackQueryDevtools.prototype,
      'setInitialIsOpen',
    )
    render(() => (
      <SolidQueryDevtools client={queryClient} initialIsOpen={true} />
    ))

    flush()
    expect(setInitialIsOpen).toHaveBeenCalledWith(true)
  })

  it('should default "initialIsOpen" to "false" when the prop is omitted', () => {
    const setInitialIsOpen = vi.spyOn(
      TanstackQueryDevtools.prototype,
      'setInitialIsOpen',
    )
    render(() => <SolidQueryDevtools client={queryClient} />)

    flush()
    expect(setInitialIsOpen).toHaveBeenCalledWith(false)
  })

  it('should forward "errorTypes" to the devtools instance', () => {
    const setErrorTypes = vi.spyOn(
      TanstackQueryDevtools.prototype,
      'setErrorTypes',
    )
    const errorTypes = [
      { name: 'Network', initializer: () => new Error('Network') },
    ]

    render(() => (
      <SolidQueryDevtools client={queryClient} errorTypes={errorTypes} />
    ))

    flush()
    expect(setErrorTypes).toHaveBeenCalledWith(errorTypes)
  })

  it('should default "errorTypes" to an empty array when the prop is omitted', () => {
    const setErrorTypes = vi.spyOn(
      TanstackQueryDevtools.prototype,
      'setErrorTypes',
    )
    render(() => <SolidQueryDevtools client={queryClient} />)

    flush()
    expect(setErrorTypes).toHaveBeenCalledWith([])
  })

  it('should forward "theme" to the devtools instance', () => {
    const setTheme = vi.spyOn(TanstackQueryDevtools.prototype, 'setTheme')
    render(() => <SolidQueryDevtools client={queryClient} theme="dark" />)

    flush()
    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('should default "theme" to "system" when the prop is omitted', () => {
    const setTheme = vi.spyOn(TanstackQueryDevtools.prototype, 'setTheme')
    render(() => <SolidQueryDevtools client={queryClient} />)

    flush()
    expect(setTheme).toHaveBeenCalledWith('system')
  })

  it('should forward the resolved "QueryClient" via "setClient"', () => {
    const setClient = vi.spyOn(TanstackQueryDevtools.prototype, 'setClient')
    render(() => <SolidQueryDevtools client={queryClient} />)

    flush()
    expect(setClient).toHaveBeenCalledWith(queryClient)
  })

  it('should forward a "buttonPosition" change to the devtools instance after mount', () => {
    const setButtonPosition = vi.spyOn(
      TanstackQueryDevtools.prototype,
      'setButtonPosition',
    )
    const [buttonPosition, setButtonPositionSignal] =
      createSignal<DevtoolsButtonPosition>('bottom-right')

    render(() => (
      <SolidQueryDevtools
        client={queryClient}
        buttonPosition={buttonPosition()}
      />
    ))
    flush()
    setButtonPosition.mockClear()

    setButtonPositionSignal('top-left')
    flush()

    expect(setButtonPosition).toHaveBeenCalledWith('top-left')
  })

  it('should forward a "position" change to the devtools instance after mount', () => {
    const setPosition = vi.spyOn(TanstackQueryDevtools.prototype, 'setPosition')
    const [position, setPositionSignal] =
      createSignal<DevtoolsPosition>('bottom')

    render(() => (
      <SolidQueryDevtools client={queryClient} position={position()} />
    ))
    flush()
    setPosition.mockClear()

    setPositionSignal('top')
    flush()

    expect(setPosition).toHaveBeenCalledWith('top')
  })

  it('should forward an "initialIsOpen" change to the devtools instance after mount', () => {
    const setInitialIsOpen = vi.spyOn(
      TanstackQueryDevtools.prototype,
      'setInitialIsOpen',
    )
    const [initialIsOpen, setInitialIsOpenSignal] = createSignal(false)

    render(() => (
      <SolidQueryDevtools
        client={queryClient}
        initialIsOpen={initialIsOpen()}
      />
    ))
    flush()
    setInitialIsOpen.mockClear()

    setInitialIsOpenSignal(true)
    flush()

    expect(setInitialIsOpen).toHaveBeenCalledWith(true)
  })

  it('should forward an "errorTypes" change to the devtools instance after mount', () => {
    const setErrorTypes = vi.spyOn(
      TanstackQueryDevtools.prototype,
      'setErrorTypes',
    )
    const [errorTypes, setErrorTypesSignal] = createSignal<
      Array<DevtoolsErrorType>
    >([])

    render(() => (
      <SolidQueryDevtools client={queryClient} errorTypes={errorTypes()} />
    ))
    flush()
    setErrorTypes.mockClear()

    const nextErrorTypes = [
      { name: 'Network', initializer: () => new Error('Network') },
    ]
    setErrorTypesSignal(nextErrorTypes)
    flush()

    expect(setErrorTypes).toHaveBeenCalledWith(nextErrorTypes)
  })

  it('should forward a "theme" change to the devtools instance after mount', () => {
    const setTheme = vi.spyOn(TanstackQueryDevtools.prototype, 'setTheme')
    const [theme, setThemeSignal] = createSignal<Theme>('light')

    render(() => <SolidQueryDevtools client={queryClient} theme={theme()} />)
    flush()
    setTheme.mockClear()

    setThemeSignal('dark')
    flush()

    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('should call "unmount" on the devtools instance when the component unmounts', async () => {
    const unmount = vi.spyOn(TanstackQueryDevtools.prototype, 'unmount')
    const { unmount: unmountComponent } = render(() => (
      <SolidQueryDevtools client={queryClient} />
    ))
    flush()
    await Promise.resolve()
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
      const { SolidQueryDevtools: ProductionDevtools } = await import('..')
      expect(ProductionDevtools({})).toBeNull()
    } finally {
      vi.doUnmock('solid-js/web')
      vi.resetModules()
    }
  })
})
