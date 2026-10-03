import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, shallowRef } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import Devtools from '../devtools.vue'
import DevtoolsPanel from '../devtoolsPanel.vue'
import type { App } from 'vue'

const { setClient, mount, unmount } = vi.hoisted(() => ({
  setClient: vi.fn(),
  mount: vi.fn(),
  unmount: vi.fn(),
}))

vi.mock('@tanstack/query-devtools', () => {
  class MockDevtools {
    setClient = setClient
    mount = mount
    unmount = unmount
    setButtonPosition = vi.fn()
    setPosition = vi.fn()
    setInitialIsOpen = vi.fn()
    setErrorTypes = vi.fn()
    setTheme = vi.fn()
    setOnClose = vi.fn()
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

    expect(setClient).toHaveBeenLastCalledWith(first)
    client.value = second
    await nextTick()

    expect(setClient).toHaveBeenLastCalledWith(second)
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

    expect(setClient).toHaveBeenLastCalledWith(contextClient)
    client.value = override
    await nextTick()
    expect(setClient).toHaveBeenLastCalledWith(override)

    client.value = undefined
    await nextTick()
    expect(setClient).toHaveBeenLastCalledWith(contextClient)
    expect(mount).toHaveBeenCalledTimes(1)
  })
})
