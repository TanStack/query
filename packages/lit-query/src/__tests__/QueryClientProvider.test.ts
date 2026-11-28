import * as core from '@tanstack/query-core'
import { QueryClient, clearQueryClient, isSuccess } from '@tanstack/query-core'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createQueryController } from '../createQueryController.js'
import {
  getDefaultQueryClient,
  resolveQueryClient,
  useQueryClient,
} from '../index.js'
import { generateElementName } from './utils.js'

const tagName = generateElementName()

describe('QueryClientProvider/context', () => {
  let queryClient: QueryClient
  let container: HTMLElement

  beforeAll(() => {
    customElements.define(tagName, QueryClientProvider)
  })

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(() => {
    container.remove()
    clearQueryClient(queryClient)
    vi.useRealTimers()
  })

  it('should register and unregister the default query client for public helpers', async () => {
    const provider = document.createElement(tagName) as QueryClientProvider
    provider.client = queryClient
    container.append(provider)
    await provider.updateComplete

    expect(useQueryClient()).toBe(queryClient)
    expect(resolveQueryClient()).toBe(queryClient)

    provider.remove()
    expect(() => useQueryClient()).toThrow(/No QueryClient available/)
  })

  it('should prefer an explicit client in resolveQueryClient', () => {
    expect(resolveQueryClient(queryClient)).toBe(queryClient)
  })

  it('should keep the default client registered until the last provider using it disconnects', async () => {
    const providerA = document.createElement(tagName) as QueryClientProvider
    const providerB = document.createElement(tagName) as QueryClientProvider
    providerA.client = queryClient
    providerB.client = queryClient
    container.append(providerA)
    container.append(providerB)
    await providerA.updateComplete
    await providerB.updateComplete

    expect(useQueryClient()).toBe(queryClient)

    providerB.remove()
    await vi.advanceTimersByTimeAsync(0)
    expect(useQueryClient()).toBe(queryClient)

    providerA.remove()
    expect(() => useQueryClient()).toThrow(/No QueryClient available/)
  })

  it('should throw when multiple different providers make global lookup ambiguous', async () => {
    const clientA = new QueryClient()
    const clientB = new QueryClient()
    const providerA = document.createElement(tagName) as QueryClientProvider
    const providerB = document.createElement(tagName) as QueryClientProvider
    providerA.client = clientA
    providerB.client = clientB
    container.append(providerA)
    container.append(providerB)
    await providerA.updateComplete
    await providerB.updateComplete

    expect(getDefaultQueryClient()).toBeUndefined()
    expect(() => useQueryClient()).toThrow(/Multiple QueryClients are mounted/)
    expect(() => resolveQueryClient()).toThrow(
      /Multiple QueryClients are mounted/,
    )

    providerB.remove()
    expect(getDefaultQueryClient()).toBe(clientA)
    expect(useQueryClient()).toBe(clientA)

    providerA.remove()
  })

  it('should require an explicit client before connect', () => {
    const provider = document.createElement(tagName) as QueryClientProvider

    expect(() => provider.connectedCallback()).toThrow(
      /No QueryClient available/,
    )
  })

  it('should preserve the mount/unmount contract when the provider is swapped while disconnected', async () => {
    const clientA = new QueryClient()
    const clientB = new QueryClient()

    const mountSpy = vi.spyOn(core, 'mountQueryClient')
    const unmountSpy = vi.spyOn(core, 'unmountQueryClient')

    const provider = document.createElement(tagName) as QueryClientProvider
    provider.client = clientA
    container.append(provider)
    await provider.updateComplete

    expect(
      mountSpy.mock.calls.filter(([client]) => client === clientA),
    ).toHaveLength(1)
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === clientA),
    ).toHaveLength(0)
    expect(
      mountSpy.mock.calls.filter(([client]) => client === clientB),
    ).toHaveLength(0)
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === clientB),
    ).toHaveLength(0)

    provider.remove()
    await vi.advanceTimersByTimeAsync(0)
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === clientA),
    ).toHaveLength(1)
    expect(
      mountSpy.mock.calls.filter(([client]) => client === clientB),
    ).toHaveLength(0)

    provider.client = clientB
    await provider.updateComplete

    expect(
      unmountSpy.mock.calls.filter(([client]) => client === clientA),
    ).toHaveLength(1)
    expect(
      mountSpy.mock.calls.filter(([client]) => client === clientB),
    ).toHaveLength(0)

    container.append(provider)
    await provider.updateComplete
    expect(
      mountSpy.mock.calls.filter(([client]) => client === clientA),
    ).toHaveLength(1)
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === clientA),
    ).toHaveLength(1)
    expect(
      mountSpy.mock.calls.filter(([client]) => client === clientB),
    ).toHaveLength(1)
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === clientB),
    ).toHaveLength(0)

    provider.remove()
    await vi.advanceTimersByTimeAsync(0)
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === clientB),
    ).toHaveLength(1)
  })

  it('should unmount the initial client when the client is replaced before the first update', async () => {
    const clientA = new QueryClient()
    const clientB = new QueryClient()

    const mountSpy = vi.spyOn(core, 'mountQueryClient')
    const unmountSpy = vi.spyOn(core, 'unmountQueryClient')

    const provider = document.createElement(tagName) as QueryClientProvider
    provider.client = clientA
    container.append(provider)

    provider.client = clientB
    await provider.updateComplete

    expect(
      mountSpy.mock.calls.filter(([client]) => client === clientA),
    ).toHaveLength(1)
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === clientA),
    ).toHaveLength(1)
    expect(
      mountSpy.mock.calls.filter(([client]) => client === clientB),
    ).toHaveLength(1)
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === clientB),
    ).toHaveLength(0)
    expect(useQueryClient()).toBe(clientB)

    provider.remove()
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === clientB),
    ).toHaveLength(1)
    expect(() => useQueryClient()).toThrow(/No QueryClient available/)
  })

  it('should not throw when the client is cleared on a disconnected provider', async () => {
    const provider = document.createElement(tagName) as QueryClientProvider
    provider.client = queryClient
    container.append(provider)
    await provider.updateComplete

    provider.remove()
    provider.client = undefined as unknown as QueryClient

    await expect(provider.updateComplete).resolves.toBe(true)
    expect(() => useQueryClient()).toThrow(/No QueryClient available/)
  })

  it('should tear down the mounted client before surfacing the error when a connected client is updated to an invalid value', async () => {
    const key = createKey()
    const mountSpy = vi.spyOn(core, 'mountQueryClient')
    const unmountSpy = vi.spyOn(core, 'unmountQueryClient')

    class Consumer extends LitElement {
      readonly query = createQueryController(this, {
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'ok'),
        retry: false,
      })
    }

    customElements.define(generateElementName(), Consumer)

    const provider = document.createElement(tagName) as QueryClientProvider
    const consumer = new Consumer()
    provider.client = queryClient
    provider.append(consumer)
    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    await vi.advanceTimersByTimeAsync(10)
    expect(isSuccess(consumer.query())).toBe(true)
    expect(
      mountSpy.mock.calls.filter(([client]) => client === queryClient),
    ).toHaveLength(1)
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === queryClient),
    ).toHaveLength(0)
    expect(consumer.query().data).toBe('ok')

    provider.client = undefined as unknown as QueryClient

    await expect(provider.updateComplete).rejects.toThrow(
      /No QueryClient available/,
    )
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === queryClient),
    ).toHaveLength(1)
    expect(getDefaultQueryClient()).toBeUndefined()
    expect(() => useQueryClient()).toThrow(/No QueryClient available/)
    expect(() => consumer.query()).toThrow(/No QueryClient available/)
    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.query.destroy()
    provider.remove()
    await vi.advanceTimersByTimeAsync(0)
    expect(
      unmountSpy.mock.calls.filter(([client]) => client === queryClient),
    ).toHaveLength(1)
  })
})
