import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/svelte-query'
import SvelteQueryDevtools from '../src/Devtools.svelte'
import Wrapper from './Wrapper.svelte'
import type { TanstackQueryDevtools } from '@tanstack/query-devtools'

const mountMock = vi.fn<TanstackQueryDevtools['mount']>()
const unmountMock = vi.fn<TanstackQueryDevtools['unmount']>()
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
    this.setButtonPosition = setButtonPositionMock
    this.setPosition = setPositionMock
    this.setInitialIsOpen = setInitialIsOpenMock
    this.setErrorTypes = setErrorTypesMock
    this.setTheme = setThemeMock
  }),
}))

describe('SvelteQueryDevtools', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render the parent container without throwing in non-development environments', () => {
    const { container } = render(SvelteQueryDevtools, {
      props: { client: queryClient },
    })

    expect(
      // oxlint-disable-next-line testing-library/no-node-access -- the devtools mount container has no role or text to query by
      container.querySelector('.tsqd-parent-container'),
    ).toBeInTheDocument()
  })

  it('should throw an error if no query client has been set', () => {
    expect(() => render(SvelteQueryDevtools)).toThrow(
      'No QueryClient was found in Svelte context. Did you forget to wrap your component with QueryClientProvider?',
    )
  })

  it('should not throw an error if query client is provided via context', () => {
    expect(() => render(Wrapper, { props: { queryClient } })).not.toThrow()
  })

  it('should not throw an error if query client is provided via props', () => {
    expect(() =>
      render(SvelteQueryDevtools, { props: { client: queryClient } }),
    ).not.toThrow()
  })

  it('should forward the initial "position" to the devtools instance', async () => {
    render(SvelteQueryDevtools, {
      props: { client: queryClient, position: 'left' },
    })

    await vi.dynamicImportSettled()
    expect(setPositionMock).toHaveBeenCalledWith('left')
  })

  it('should forward the initial "buttonPosition" to the devtools instance', async () => {
    render(SvelteQueryDevtools, {
      props: { client: queryClient, buttonPosition: 'top-left' },
    })

    await vi.dynamicImportSettled()
    expect(setButtonPositionMock).toHaveBeenCalledWith('top-left')
  })

  it('should forward the initial "initialIsOpen" to the devtools instance', async () => {
    render(SvelteQueryDevtools, {
      props: { client: queryClient, initialIsOpen: true },
    })

    await vi.dynamicImportSettled()
    expect(setInitialIsOpenMock).toHaveBeenCalledWith(true)
  })

  it('should forward the initial "errorTypes" to the devtools instance', async () => {
    const errorTypes = [{ name: 'Error', initializer: () => new Error() }]
    render(SvelteQueryDevtools, {
      props: { client: queryClient, errorTypes },
    })

    await vi.dynamicImportSettled()
    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })

  it('should forward the initial "theme" to the devtools instance', async () => {
    render(SvelteQueryDevtools, {
      props: { client: queryClient, theme: 'dark' },
    })

    await vi.dynamicImportSettled()
    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('should forward an undefined "theme" to the devtools instance when the prop is omitted', async () => {
    render(SvelteQueryDevtools, {
      props: { client: queryClient },
    })

    await vi.dynamicImportSettled()
    expect(setThemeMock).toHaveBeenCalledWith(undefined)
  })

  it('should forward a "position" change to the devtools instance after mount', async () => {
    const { rerender } = render(SvelteQueryDevtools, {
      props: { client: queryClient, position: 'bottom' },
    })

    await vi.dynamicImportSettled()
    setPositionMock.mockClear()

    await rerender({ client: queryClient, position: 'top' })

    expect(setPositionMock).toHaveBeenCalledWith('top')
  })

  it('should forward a "buttonPosition" change to the devtools instance after mount', async () => {
    const { rerender } = render(SvelteQueryDevtools, {
      props: { client: queryClient, buttonPosition: 'bottom-right' },
    })

    await vi.dynamicImportSettled()
    setButtonPositionMock.mockClear()

    await rerender({ client: queryClient, buttonPosition: 'top-left' })

    expect(setButtonPositionMock).toHaveBeenCalledWith('top-left')
  })

  it('should forward an "initialIsOpen" change to the devtools instance after mount', async () => {
    const { rerender } = render(SvelteQueryDevtools, {
      props: { client: queryClient, initialIsOpen: false },
    })

    await vi.dynamicImportSettled()
    setInitialIsOpenMock.mockClear()

    await rerender({ client: queryClient, initialIsOpen: true })

    expect(setInitialIsOpenMock).toHaveBeenCalledWith(true)
  })

  it('should forward an "errorTypes" change to the devtools instance after mount', async () => {
    const { rerender } = render(SvelteQueryDevtools, {
      props: { client: queryClient, errorTypes: [] },
    })

    await vi.dynamicImportSettled()
    setErrorTypesMock.mockClear()

    const errorTypes = [{ name: 'Error', initializer: () => new Error() }]
    await rerender({ client: queryClient, errorTypes })

    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })

  it('should forward a "theme" change to the devtools instance after mount', async () => {
    const { rerender } = render(SvelteQueryDevtools, {
      props: { client: queryClient, theme: 'light' },
    })

    await vi.dynamicImportSettled()
    setThemeMock.mockClear()

    await rerender({ client: queryClient, theme: 'dark' })

    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })
})
