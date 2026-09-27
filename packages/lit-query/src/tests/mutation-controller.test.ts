import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createMutationController } from '../createMutationController.js'
import type { MutationResultAccessor } from '../createMutationController.js'
import { generateElementName } from './test-utils.js'

const providerTagName = generateElementName()
customElements.define(providerTagName, QueryClientProvider)

describe('createMutationController', () => {
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

  it('should resolve from the pre-connect placeholder state on the first provider connection', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly mutationKey = key

      readonly mutation = createMutationController(this, {
        mutationKey: this.mutationKey,
        mutationFn: (value: number) => sleep(10).then(() => value + 1),
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.mutation().isIdle).toBe(true)
    expect(() => consumer.mutation.mutate(1)).toThrow(
      /No QueryClient available/,
    )
    await expect(consumer.mutation.mutateAsync(1)).rejects.toThrow(
      /No QueryClient available/,
    )

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete

    await Promise.resolve()
    const mutatePromise = consumer.mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(2)
    expect(consumer.mutation().isSuccess).toBe(true)

    consumer.mutation.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should prefer an explicit client over the provider context', async () => {
    const key = queryKey()
    const providerClient = new QueryClient()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = providerClient

    class Consumer extends LitElement {
      readonly mutationKey = key

      readonly mutation = createMutationController(
        this,
        {
          mutationKey: this.mutationKey,
          mutationFn: (value: number) => sleep(10).then(() => value + 1),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete

    await Promise.resolve()
    const mutatePromise = consumer.mutation.mutateAsync(2)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(3)

    expect(
      queryClient
        .getMutationCache()
        .findAll({ mutationKey: consumer.mutationKey }).length,
    ).toBeGreaterThan(0)
    expect(
      providerClient
        .getMutationCache()
        .findAll({ mutationKey: consumer.mutationKey }).length,
    ).toBe(0)

    consumer.mutation.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should support mutate and mutateAsync paths', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (value: number) => sleep(10).then(() => value + 1),
        },
        queryClient,
      )

      override render() {
        return html`data: ${this.mutation().data ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation
    await host.updateComplete

    expect(host.shadowRoot?.textContent).toContain('data: none')

    const resultPromise = mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(resultPromise).resolves.toBe(2)
    expect(mutation().isSuccess).toBe(true)
    expect(mutation().data).toBe(2)
    expect(host.shadowRoot?.textContent).toContain('data: 2')

    mutation.mutate(2)
    await vi.advanceTimersByTimeAsync(10)
    expect(mutation().data).toBe(3)
    expect(mutation().isSuccess).toBe(true)
    expect(host.shadowRoot?.textContent).toContain('data: 3')
  })

  it('should cover idle/pending/success/error mutation state transitions', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: async (value: number) => {
            await sleep(10)
            if (value < 0) {
              throw new Error('negative-not-allowed')
            }
            return value + 1
          },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    expect(mutation().isIdle).toBe(true)

    const successPromise = mutation.mutateAsync(10)
    await vi.advanceTimersByTimeAsync(0)
    expect(mutation().isPending).toBe(true)
    await vi.advanceTimersByTimeAsync(10)
    await expect(successPromise).resolves.toBe(11)
    expect(mutation().isSuccess).toBe(true)
    expect(mutation().data).toBe(11)

    const errorPromise = mutation
      .mutateAsync(-1)
      .catch((error: unknown) => error)
    expect(mutation().isPending).toBe(true)
    await vi.advanceTimersByTimeAsync(10)
    expect(await errorPromise).toEqual(new Error('negative-not-allowed'))
    expect(mutation().isError).toBe(true)
    expect(mutation().error).toEqual(new Error('negative-not-allowed'))
  })

  it('should reset mutation state back to the idle baseline', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: () =>
            sleep(10).then(() => Promise.reject(new Error('reset-target'))),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    await Promise.all([
      expect(mutation.mutateAsync(undefined)).rejects.toThrow('reset-target'),
      vi.advanceTimersByTimeAsync(10),
    ])
    expect(mutation().isError).toBe(true)
    expect(mutation().error).toEqual(new Error('reset-target'))

    mutation.reset()
    expect(mutation().isIdle).toBe(true)
    expect(mutation().isPaused).toBe(false)
    expect(mutation().isError).toBe(false)
    expect(mutation().error).toBeNull()
    expect(mutation().data).toBeUndefined()
  })

  it('should not throw from mutate while mutateAsync rejects on error', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: async (value: number) => {
            await sleep(10)
            if (value < 0) {
              throw new Error('negative-not-allowed')
            }

            return value + 1
          },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    expect(() => mutation.mutate(-1)).not.toThrow()
    await vi.advanceTimersByTimeAsync(10)
    expect(mutation().isError).toBe(true)
    expect(mutation().error).toEqual(new Error('negative-not-allowed'))

    await Promise.all([
      expect(mutation.mutateAsync(-1)).rejects.toThrow('negative-not-allowed'),
      vi.advanceTimersByTimeAsync(10),
    ])
  })

  it('should call mutation callbacks in a deterministic order and count', async () => {
    const callbackEvents: string[] = []
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: async (value: number) => {
            await sleep(10)
            if (value < 0) {
              throw new Error('callback-order-failure')
            }
            return value + 1
          },
          onSuccess: (_data, value) => {
            callbackEvents.push(`success:${value}`)
          },
          onError: (_error, value) => {
            callbackEvents.push(`error:${value}`)
          },
          onSettled: (_data, _error, value) => {
            callbackEvents.push(`settled:${value}`)
          },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    const successPromise = mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(successPromise).resolves.toBe(2)

    await Promise.all([
      expect(mutation.mutateAsync(-1)).rejects.toThrow(
        'callback-order-failure',
      ),
      vi.advanceTimersByTimeAsync(10),
    ])

    expect(callbackEvents).toEqual([
      'success:1',
      'settled:1',
      'error:-1',
      'settled:-1',
    ])
  })

  it('should use the latest closures for refreshed mutation callbacks', async () => {
    const callbackEvents: string[] = []
    let version = 'v1'
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        () => ({
          mutationFn: async (value: number) => {
            await sleep(10)
            if (value < 0) {
              throw new Error('freshness-failure')
            }
            return value + 1
          },
          onSuccess: () => {
            callbackEvents.push(`success:${version}`)
          },
          onError: () => {
            callbackEvents.push(`error:${version}`)
          },
          onSettled: () => {
            callbackEvents.push(`settled:${version}`)
          },
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    const successPromise = mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(successPromise).resolves.toBe(2)
    expect(callbackEvents.slice(0, 2)).toEqual(['success:v1', 'settled:v1'])

    version = 'v2'
    host.requestUpdate()
    await host.updateComplete

    await Promise.all([
      expect(mutation.mutateAsync(-1)).rejects.toThrow('freshness-failure'),
      vi.advanceTimersByTimeAsync(10),
    ])
    expect(callbackEvents.slice(2)).toEqual(['error:v2', 'settled:v2'])
  })

  it('should become a deterministic missing-client state when the provider is missing', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly mutationKey = key

      readonly mutation = createMutationController(this, {
        mutationKey: this.mutationKey,
        mutationFn: (value: number) => sleep(10).then(() => value + 1),
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    const placeholderResult = consumer.mutation()

    expect(placeholderResult.isIdle).toBe(true)
    expect(placeholderResult.isPaused).toBe(false)

    container.append(consumer)

    expect(() => consumer.mutation()).not.toThrow()
    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.mutation()).toThrow(/No QueryClient available/)
    expect(() => consumer.mutation.mutate(1)).toThrow(
      /No QueryClient available/,
    )
    await expect(consumer.mutation.mutateAsync(1)).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(placeholderResult.mutate(1)).rejects.toThrow(
      /No QueryClient available/,
    )

    expect(() => consumer.mutation.reset()).not.toThrow()
    expect(() => placeholderResult.reset()).not.toThrow()

    consumer.mutation.destroy()
    consumer.remove()
    await Promise.resolve()
  })

  it('should recover without reconstruction when a valid provider is adopted later', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly mutationKey = key

      readonly mutation = createMutationController(this, {
        mutationKey: this.mutationKey,
        mutationFn: (value: number) => sleep(10).then(() => value + 1),
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    container.append(consumer)

    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.mutation()).toThrow(/No QueryClient available/)

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete

    await Promise.resolve()
    const mutatePromise = consumer.mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(2)
    expect(consumer.mutation().isSuccess).toBe(true)

    consumer.mutation.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should not throw for a mutation controller on an already-connected host with an explicit client', async () => {
    // Regression test for SSR hydration scenario where controller is created
    // during willUpdate on an already-connected host.
    class Host extends LitElement {
      mutation?: MutationResultAccessor<number, Error, number, unknown>
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    await host.updateComplete

    // Lit calls hostConnected immediately when a controller is added to an
    // already-connected host
    host.mutation = createMutationController(
      host,
      {
        mutationKey: queryKey(),
        mutationFn: (value: number) => sleep(10).then(() => value * 2),
      },
      queryClient,
    )
    const mutation = host.mutation

    // Wait for the deferred onConnected to complete
    await Promise.resolve()
    await Promise.resolve()

    // Mutation controller should work correctly
    expect(mutation().isIdle).toBe(true)

    const mutatePromise = mutation.mutateAsync(5)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(10)
    expect(mutation().isSuccess).toBe(true)

    mutation.destroy()
  })

  it('should defer explicit-client mutation accessors until host fields are initialized', () => {
    const key = queryKey()

    class DeferredExplicitMutationHost extends LitElement {
      readonly mutation = createMutationController(
        this,
        () => ({
          mutationKey: [...key, this.id],
          mutationFn: async (value: number) => value + this.offset,
        }),
        queryClient,
      )

      readonly firstRead = this.mutation()
      readonly id = 'alpha'
      readonly offset = 1
    }
    customElements.define(generateElementName(), DeferredExplicitMutationHost)

    expect(() => new DeferredExplicitMutationHost()).not.toThrow()

    const host = new DeferredExplicitMutationHost()
    expect(host.mutation().isIdle).toBe(true)

    host.mutation.destroy()
  })
})
