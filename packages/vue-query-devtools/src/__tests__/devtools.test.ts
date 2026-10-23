import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, shallowRef } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import Devtools from '../devtools.vue'
import type { App } from 'vue'
import type { TanstackQueryDevtools } from '@tanstack/query-devtools'
import type { DevtoolsOptions } from '../types'

const {
  setButtonPositionMock,
  setPositionMock,
  setInitialIsOpenMock,
  setErrorTypesMock,
  setThemeMock,
} = vi.hoisted(() => ({
  setButtonPositionMock: vi.fn<TanstackQueryDevtools['setButtonPosition']>(),
  setPositionMock: vi.fn<TanstackQueryDevtools['setPosition']>(),
  setInitialIsOpenMock: vi.fn<TanstackQueryDevtools['setInitialIsOpen']>(),
  setErrorTypesMock: vi.fn<TanstackQueryDevtools['setErrorTypes']>(),
  setThemeMock: vi.fn<TanstackQueryDevtools['setTheme']>(),
}))

// oxlint-disable-next-line vitest/prefer-import-in-mock -- the mocked devtools classes have '#private' fields, and this environment cannot load the real Solid module
vi.mock('@tanstack/query-devtools', () => {
  class MockDevtools {
    setClient = vi.fn<TanstackQueryDevtools['setClient']>()
    mount = vi.fn<TanstackQueryDevtools['mount']>()
    unmount = vi.fn<TanstackQueryDevtools['unmount']>()
    setButtonPosition = setButtonPositionMock
    setPosition = setPositionMock
    setInitialIsOpen = setInitialIsOpenMock
    setErrorTypes = setErrorTypesMock
    setTheme = setThemeMock
  }
  return { TanstackQueryDevtools: MockDevtools }
})

describe('VueQueryDevtools', () => {
  let queryClient: QueryClient
  let app: App | undefined
  let container: HTMLDivElement | undefined

  const renderDevtools = (initialProps: DevtoolsOptions) => {
    const props = shallowRef(initialProps)
    container = document.createElement('div')
    app = createApp(() => h(Devtools, props.value))
    app.mount(container)
    return props
  }

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  afterEach(() => {
    app?.unmount()
    container?.remove()
    vi.clearAllMocks()
  })

  it('should forward an undefined "theme" to the devtools instance when the prop is omitted', () => {
    renderDevtools({ client: queryClient })

    expect(setThemeMock).toHaveBeenCalledWith(undefined)
  })

  it('should forward a "buttonPosition" change to the devtools instance after mount', async () => {
    const props = renderDevtools({
      client: queryClient,
      buttonPosition: 'bottom-right',
    })
    setButtonPositionMock.mockClear()

    props.value = { client: queryClient, buttonPosition: 'top-left' }
    await nextTick()

    expect(setButtonPositionMock).toHaveBeenCalledWith('top-left')
  })

  it('should forward a "position" change to the devtools instance after mount', async () => {
    const props = renderDevtools({ client: queryClient, position: 'bottom' })
    setPositionMock.mockClear()

    props.value = { client: queryClient, position: 'top' }
    await nextTick()

    expect(setPositionMock).toHaveBeenCalledWith('top')
  })

  it('should forward an "initialIsOpen" change to the devtools instance after mount', async () => {
    const props = renderDevtools({ client: queryClient, initialIsOpen: false })
    setInitialIsOpenMock.mockClear()

    props.value = { client: queryClient, initialIsOpen: true }
    await nextTick()

    expect(setInitialIsOpenMock).toHaveBeenCalledWith(true)
  })

  it('should forward an "errorTypes" change to the devtools instance after mount', async () => {
    const props = renderDevtools({ client: queryClient, errorTypes: [] })
    setErrorTypesMock.mockClear()

    const errorTypes = [{ name: 'Error', initializer: () => new Error() }]
    props.value = { client: queryClient, errorTypes }
    await nextTick()

    expect(setErrorTypesMock).toHaveBeenCalledWith(errorTypes)
  })

  it('should forward a "theme" change to the devtools instance after mount', async () => {
    const props = renderDevtools({ client: queryClient, theme: 'light' })
    setThemeMock.mockClear()

    props.value = { client: queryClient, theme: 'dark' }
    await nextTick()

    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })
})
