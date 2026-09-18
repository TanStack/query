import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/svelte-query'
import SvelteQueryDevtools from '../src/Devtools.svelte'
import Wrapper from './Wrapper.svelte'
import type { TanstackQueryDevtools } from '@tanstack/query-devtools'

const setButtonPositionMock = vi.fn()
const setPositionMock = vi.fn()
const setInitialIsOpenMock = vi.fn()
const setErrorTypesMock = vi.fn()

vi.mock('@tanstack/query-devtools', () => ({
  TanstackQueryDevtools: vi.fn(function (this: TanstackQueryDevtools) {
    this.mount = vi.fn()
    this.unmount = vi.fn()
    this.setButtonPosition = setButtonPositionMock
    this.setPosition = setPositionMock
    this.setInitialIsOpen = setInitialIsOpenMock
    this.setErrorTypes = setErrorTypesMock
  }),
}))

describe('SvelteQueryDevtools', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render the parent container without throwing in non-development environments', () => {
    const queryClient = new QueryClient()

    const { container } = render(SvelteQueryDevtools, {
      props: { client: queryClient },
    })

    expect(
      container.querySelector('.tsqd-parent-container'),
    ).toBeInTheDocument()
  })

  it('should throw an error if no query client has been set', () => {
    expect(() => render(SvelteQueryDevtools)).toThrow(
      'No QueryClient was found in Svelte context. Did you forget to wrap your component with QueryClientProvider?',
    )
  })

  it('should not throw an error if query client is provided via context', () => {
    const queryClient = new QueryClient()

    expect(() => render(Wrapper, { props: { queryClient } })).not.toThrow()
  })

  it('should not throw an error if query client is provided via props', () => {
    const queryClient = new QueryClient()

    expect(() =>
      render(SvelteQueryDevtools, { props: { client: queryClient } }),
    ).not.toThrow()
  })

  it('should forward the initial "position" to the devtools instance', async () => {
    const queryClient = new QueryClient()
    render(SvelteQueryDevtools, {
      props: { client: queryClient, position: 'left' },
    })
    await vi.dynamicImportSettled()

    expect(setPositionMock).toHaveBeenCalledWith('left')
  })

  it('should forward the initial "buttonPosition" to the devtools instance', async () => {
    const queryClient = new QueryClient()
    render(SvelteQueryDevtools, {
      props: { client: queryClient, buttonPosition: 'top-left' },
    })
    await vi.dynamicImportSettled()

    expect(setButtonPositionMock).toHaveBeenCalledWith('top-left')
  })

  it('should forward the initial "initialIsOpen" to the devtools instance', async () => {
    const queryClient = new QueryClient()
    render(SvelteQueryDevtools, {
      props: { client: queryClient, initialIsOpen: true },
    })
    await vi.dynamicImportSettled()

    expect(setInitialIsOpenMock).toHaveBeenCalledWith(true)
  })

  it('should forward the initial "errorTypes" to the devtools instance', async () => {
    const queryClient = new QueryClient()
    const errorTypes = [{ name: 'Error', initializer: () => new Error() }]
    render(SvelteQueryDevtools, {
      props: { client: queryClient, errorTypes },
    })
    await vi.dynamicImportSettled()

    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })

  it('should forward a "position" change to the devtools instance after mount', async () => {
    const queryClient = new QueryClient()
    const { rerender } = render(SvelteQueryDevtools, {
      props: { client: queryClient, position: 'bottom' },
    })
    await vi.dynamicImportSettled()
    setPositionMock.mockClear()

    await rerender({ client: queryClient, position: 'top' })

    expect(setPositionMock).toHaveBeenCalledWith('top')
  })

  it('should forward a "buttonPosition" change to the devtools instance after mount', async () => {
    const queryClient = new QueryClient()
    const { rerender } = render(SvelteQueryDevtools, {
      props: { client: queryClient, buttonPosition: 'bottom-right' },
    })
    await vi.dynamicImportSettled()
    setButtonPositionMock.mockClear()

    await rerender({ client: queryClient, buttonPosition: 'top-left' })

    expect(setButtonPositionMock).toHaveBeenCalledWith('top-left')
  })

  it('should forward an "initialIsOpen" change to the devtools instance after mount', async () => {
    const queryClient = new QueryClient()
    const { rerender } = render(SvelteQueryDevtools, {
      props: { client: queryClient, initialIsOpen: false },
    })
    await vi.dynamicImportSettled()
    setInitialIsOpenMock.mockClear()

    await rerender({ client: queryClient, initialIsOpen: true })

    expect(setInitialIsOpenMock).toHaveBeenCalledWith(true)
  })

  it('should forward an "errorTypes" change to the devtools instance after mount', async () => {
    const queryClient = new QueryClient()
    const { rerender } = render(SvelteQueryDevtools, {
      props: { client: queryClient, errorTypes: [] },
    })
    await vi.dynamicImportSettled()
    setErrorTypesMock.mockClear()

    const errorTypes = [{ name: 'Error', initializer: () => new Error() }]
    await rerender({ client: queryClient, errorTypes })

    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })
})
