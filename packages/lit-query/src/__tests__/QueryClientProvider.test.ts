import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { createQueryController } from '../createQueryController.js'
import {
  getDefaultQueryClient,
  resolveQueryClient,
  useQueryClient,
} from '../index.js'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { generateElementName } from './utils.js'

const tagName = generateElementName()
customElements.define(tagName, QueryClientProvider)

describe('QueryClientProvider/context', () => {
  let queryClient: QueryClient
  let container: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(() => {
    container.remove()
    queryClient.clear()
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

    const mountA = vi.spyOn(clientA, 'mount')
    const unmountA = vi.spyOn(clientA, 'unmount')
    const mountB = vi.spyOn(clientB, 'mount')
    const unmountB = vi.spyOn(clientB, 'unmount')

    const provider = document.createElement(tagName) as QueryClientProvider
    provider.client = clientA

    container.append(provider)
    await provider.updateComplete

    expect(mountA).toHaveBeenCalledTimes(1)
    expect(unmountA).toHaveBeenCalledTimes(0)
    expect(mountB).toHaveBeenCalledTimes(0)
    expect(unmountB).toHaveBeenCalledTimes(0)

    provider.remove()
    await vi.advanceTimersByTimeAsync(0)
    expect(unmountA).toHaveBeenCalledTimes(1)
    expect(mountB).toHaveBeenCalledTimes(0)

    provider.client = clientB
    await provider.updateComplete
    expect(unmountA).toHaveBeenCalledTimes(1)
    expect(mountB).toHaveBeenCalledTimes(0)

    container.append(provider)
    await provider.updateComplete

    expect(mountA).toHaveBeenCalledTimes(1)
    expect(unmountA).toHaveBeenCalledTimes(1)
    expect(mountB).toHaveBeenCalledTimes(1)
    expect(unmountB).toHaveBeenCalledTimes(0)

    provider.remove()
    await vi.advanceTimersByTimeAsync(0)
    expect(unmountB).toHaveBeenCalledTimes(1)

    mountA.mockRestore()
    unmountA.mockRestore()
    mountB.mockRestore()
    unmountB.mockRestore()
  })

  it('should tear down the mounted client before surfacing the error when a connected client is updated to an invalid value', async () => {
    const key = queryKey()
    const mount = vi.spyOn(queryClient, 'mount')
    const unmount = vi.spyOn(queryClient, 'unmount')

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
    expect(consumer.query().isSuccess).toBe(true)
    expect(mount).toHaveBeenCalledTimes(1)
    expect(unmount).toHaveBeenCalledTimes(0)
    expect(consumer.query().data).toBe('ok')

    provider.client = undefined as unknown as QueryClient
    await expect(provider.updateComplete).rejects.toThrow(
      /No QueryClient available/,
    )
    expect(unmount).toHaveBeenCalledTimes(1)
    expect(getDefaultQueryClient()).toBeUndefined()
    expect(() => useQueryClient()).toThrow(/No QueryClient available/)
    expect(() => consumer.query()).toThrow(/No QueryClient available/)
    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.query.destroy()
    provider.remove()
    await vi.advanceTimersByTimeAsync(0)
    expect(unmount).toHaveBeenCalledTimes(1)

    mount.mockRestore()
    unmount.mockRestore()
  })
})
