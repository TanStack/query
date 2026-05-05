import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { createQueryController } from '../createQueryController.js'
import {
  getDefaultQueryClient,
  resolveQueryClient,
  useQueryClient,
} from '../index.js'
import { QueryClientProvider } from '../QueryClientProvider.js'
import {
  TestElementHost,
  waitFor,
  waitForMissingQueryClient,
} from './testHost.js'

const tagName = 'test-query-client-provider'
if (!customElements.get(tagName)) {
  customElements.define(tagName, QueryClientProvider)
}

class ProviderContextConsumerElement extends TestElementHost {
  readonly query = createQueryController(this, {
    queryKey: ['provider-context-consumer'] as const,
    queryFn: async () => 'ok',
    retry: false,
  })
}

const consumerTagName = 'test-query-client-provider-consumer'
if (!customElements.get(consumerTagName)) {
  customElements.define(consumerTagName, ProviderContextConsumerElement)
}

describe('QueryClientProvider/context', () => {
  it('registers and unregisters the default query client for public helpers', async () => {
    const client = new QueryClient()
    const provider = document.createElement(tagName) as QueryClientProvider
    provider.client = client

    document.body.append(provider)
    await provider.updateComplete

    expect(useQueryClient()).toBe(client)
    expect(resolveQueryClient()).toBe(client)

    provider.remove()
    await Promise.resolve()

    expect(() => useQueryClient()).toThrowError(/No QueryClient available/)
  })

  it('prefers an explicit client in resolveQueryClient', () => {
    const explicit = new QueryClient()
    expect(resolveQueryClient(explicit)).toBe(explicit)
  })

  it('keeps the default client registered until the last provider using it disconnects', async () => {
    const client = new QueryClient()
    const providerA = document.createElement(tagName) as QueryClientProvider
    const providerB = document.createElement(tagName) as QueryClientProvider
    providerA.client = client
    providerB.client = client

    document.body.append(providerA)
    document.body.append(providerB)
    await providerA.updateComplete
    await providerB.updateComplete

    expect(useQueryClient()).toBe(client)

    providerB.remove()
    await Promise.resolve()

    expect(useQueryClient()).toBe(client)

    providerA.remove()
    await Promise.resolve()

    expect(() => useQueryClient()).toThrowError(/No QueryClient available/)
  })

  it('throws when multiple different providers make global lookup ambiguous', async () => {
    const clientA = new QueryClient()
    const clientB = new QueryClient()
    const providerA = document.createElement(tagName) as QueryClientProvider
    const providerB = document.createElement(tagName) as QueryClientProvider
    providerA.client = clientA
    providerB.client = clientB

    document.body.append(providerA)
    document.body.append(providerB)
    await providerA.updateComplete
    await providerB.updateComplete

    expect(getDefaultQueryClient()).toBeUndefined()
    expect(() => useQueryClient()).toThrowError(
      /Multiple QueryClients are mounted/,
    )
    expect(() => resolveQueryClient()).toThrowError(
      /Multiple QueryClients are mounted/,
    )

    providerB.remove()
    await Promise.resolve()

    expect(getDefaultQueryClient()).toBe(clientA)
    expect(useQueryClient()).toBe(clientA)

    providerA.remove()
    await Promise.resolve()
  })

  it('requires an explicit client before connect', () => {
    const provider = document.createElement(tagName) as QueryClientProvider
    expect(() => provider.connectedCallback()).toThrowError(
      /No QueryClient available/,
    )
  })

  it('S8: provider swap while disconnected preserves mount/unmount contract', async () => {
    const clientA = new QueryClient()
    const clientB = new QueryClient()

    const mountA = vi.spyOn(clientA, 'mount')
    const unmountA = vi.spyOn(clientA, 'unmount')
    const mountB = vi.spyOn(clientB, 'mount')
    const unmountB = vi.spyOn(clientB, 'unmount')

    const provider = document.createElement(tagName) as QueryClientProvider
    provider.client = clientA

    document.body.append(provider)
    await provider.updateComplete

    expect(mountA).toHaveBeenCalledTimes(1)
    expect(unmountA).toHaveBeenCalledTimes(0)
    expect(mountB).toHaveBeenCalledTimes(0)
    expect(unmountB).toHaveBeenCalledTimes(0)

    provider.remove()
    await Promise.resolve()

    expect(unmountA).toHaveBeenCalledTimes(1)
    expect(mountB).toHaveBeenCalledTimes(0)

    provider.client = clientB
    await provider.updateComplete

    expect(unmountA).toHaveBeenCalledTimes(1)
    expect(mountB).toHaveBeenCalledTimes(0)

    document.body.append(provider)
    await provider.updateComplete

    expect(mountA).toHaveBeenCalledTimes(1)
    expect(unmountA).toHaveBeenCalledTimes(1)
    expect(mountB).toHaveBeenCalledTimes(1)
    expect(unmountB).toHaveBeenCalledTimes(0)

    provider.remove()
    await Promise.resolve()

    expect(unmountB).toHaveBeenCalledTimes(1)

    mountA.mockRestore()
    unmountA.mockRestore()
    mountB.mockRestore()
    unmountB.mockRestore()
  })

  it('LC-PROVIDER-01: invalid connected client updates tear down the mounted client before surfacing the error', async () => {
    const client = new QueryClient()
    const mount = vi.spyOn(client, 'mount')
    const unmount = vi.spyOn(client, 'unmount')

    const provider = document.createElement(tagName) as QueryClientProvider
    const consumer = document.createElement(
      consumerTagName,
    ) as ProviderContextConsumerElement
    provider.client = client
    provider.append(consumer)

    document.body.append(provider)
    await provider.updateComplete
    await consumer.updateComplete
    await waitFor(() => consumer.query().isSuccess)

    expect(mount).toHaveBeenCalledTimes(1)
    expect(unmount).toHaveBeenCalledTimes(0)
    expect(consumer.query().data).toBe('ok')

    provider.client = undefined as unknown as QueryClient
    await expect(provider.updateComplete).rejects.toThrow(
      /No QueryClient available/,
    )
    expect(unmount).toHaveBeenCalledTimes(1)
    expect(getDefaultQueryClient()).toBeUndefined()
    expect(() => useQueryClient()).toThrowError(/No QueryClient available/)
    await waitForMissingQueryClient(() => consumer.query())
    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.query.destroy()
    provider.remove()
    await Promise.resolve()

    expect(unmount).toHaveBeenCalledTimes(1)

    mount.mockRestore()
    unmount.mockRestore()
  })
})
