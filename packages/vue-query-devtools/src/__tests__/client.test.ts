import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, shallowRef } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import Devtools from '../devtools.vue'
import DevtoolsPanel from '../devtoolsPanel.vue'
import type { App } from 'vue'
import type { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'

const { setClient, mount, unmount } = vi.hoisted(() => ({
  setClient: vi.fn<TanstackQueryDevtoolsPanel['setClient']>(),
  mount: vi.fn<TanstackQueryDevtoolsPanel['mount']>(),
  unmount: vi.fn<TanstackQueryDevtoolsPanel['unmount']>(),
}))

// oxlint-disable-next-line vitest/prefer-import-in-mock -- the mocked devtools classes have '#private' fields, and this environment cannot load the real Solid module
vi.mock('@tanstack/query-devtools', () => {
  class MockDevtools {
    setClient = setClient
    mount = mount
    unmount = unmount
    setButtonPosition = vi.fn<TanstackQueryDevtoolsPanel['setButtonPosition']>()
    setPosition = vi.fn<TanstackQueryDevtoolsPanel['setPosition']>()
    setInitialIsOpen = vi.fn<TanstackQueryDevtoolsPanel['setInitialIsOpen']>()
    setErrorTypes = vi.fn<TanstackQueryDevtoolsPanel['setErrorTypes']>()
    setTheme = vi.fn<TanstackQueryDevtoolsPanel['setTheme']>()
    setOnClose = vi.fn<TanstackQueryDevtoolsPanel['setOnClose']>()
  }
  return {
    TanstackQueryDevtools: MockDevtools,
    TanstackQueryDevtoolsPanel: MockDevtools,
  }
})

describe.each([
  ['floating', Devtools],
  ['embedded', DevtoolsPanel],
] as const)('%s devtools client', (_, component) => {
  let app: App | undefined
  let container: HTMLDivElement | undefined

  afterEach(() => {
    app?.unmount()
    container?.remove()
    vi.clearAllMocks()
  })

  it('switches explicit clients without remounting or requiring a provider', async () => {
    const first = new QueryClient()
    const second = new QueryClient()
    const client = shallowRef(first)
    container = document.createElement('div')
    app = createApp(() => h(component, { client: client.value }))
    app.mount(container)

    expect(setClient.mock.lastCall?.[0]).toBe(first)
    client.value = second
    await nextTick()

    expect(setClient.mock.lastCall?.[0]).toBe(second)
    expect(mount).toHaveBeenCalledTimes(1)
    expect(unmount).not.toHaveBeenCalled()
  })

  it('returns to the initial context client after an override is removed', async () => {
    const contextClient = new QueryClient()
    const override = new QueryClient()
    const client = shallowRef<QueryClient>()
    container = document.createElement('div')
    app = createApp(() => h(component, { client: client.value }))
    app.use(VueQueryPlugin, { queryClient: contextClient })
    app.mount(container)

    expect(setClient.mock.lastCall?.[0]).toBe(contextClient)
    client.value = override
    await nextTick()
    expect(setClient.mock.lastCall?.[0]).toBe(override)

    client.value = undefined
    await nextTick()
    expect(setClient.mock.lastCall?.[0]).toBe(contextClient)
    expect(mount).toHaveBeenCalledTimes(1)
  })
})
