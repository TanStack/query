import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import SolidQueryDevtools from '../devtools'

describe('SolidQueryDevtools', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should throw an error if no query client has been set', () => {
    expect(() => render(() => <SolidQueryDevtools />)).toThrow(
      'No QueryClient set, use QueryClientProvider to set one',
    )
  })

  it('should not throw an error if query client is provided via context', () => {
    const queryClient = new QueryClient()

    expect(() =>
      render(() => (
        <QueryClientProvider client={queryClient}>
          <SolidQueryDevtools />
        </QueryClientProvider>
      )),
    ).not.toThrow()
  })

  it('should not throw an error if query client is provided via props', () => {
    const queryClient = new QueryClient()

    expect(() =>
      render(() => <SolidQueryDevtools client={queryClient} />),
    ).not.toThrow()
  })

  it('should forward "initialIsOpen" to the devtools instance', () => {
    const setInitialIsOpen = vi.spyOn(
      TanstackQueryDevtools.prototype,
      'setInitialIsOpen',
    )
    const queryClient = new QueryClient()

    render(() => (
      <SolidQueryDevtools client={queryClient} initialIsOpen={true} />
    ))

    expect(setInitialIsOpen).toHaveBeenCalledWith(true)
  })

  it('should forward "errorTypes" to the devtools instance', () => {
    const setErrorTypes = vi.spyOn(
      TanstackQueryDevtools.prototype,
      'setErrorTypes',
    )
    const queryClient = new QueryClient()
    const errorTypes = [
      { name: 'Network', initializer: () => new Error('Network') },
    ]

    render(() => (
      <SolidQueryDevtools client={queryClient} errorTypes={errorTypes} />
    ))

    expect(setErrorTypes).toHaveBeenCalledWith(errorTypes)
  })

  it('should forward "theme" to the devtools instance', () => {
    const setTheme = vi.spyOn(TanstackQueryDevtools.prototype, 'setTheme')
    const queryClient = new QueryClient()

    render(() => <SolidQueryDevtools client={queryClient} theme="dark" />)

    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('should forward the resolved "QueryClient" via "setClient"', () => {
    const setClient = vi.spyOn(TanstackQueryDevtools.prototype, 'setClient')
    const queryClient = new QueryClient()

    render(() => <SolidQueryDevtools client={queryClient} />)

    expect(setClient).toHaveBeenCalledWith(queryClient)
  })

  it('should call "unmount" on the devtools instance when the component unmounts', () => {
    const unmount = vi.spyOn(TanstackQueryDevtools.prototype, 'unmount')
    const queryClient = new QueryClient()

    const { unmount: unmountComponent } = render(() => (
      <SolidQueryDevtools client={queryClient} />
    ))
    unmountComponent()

    expect(unmount).toHaveBeenCalled()
  })
})
