import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createMutationController } from '../createMutationController.js'
import { TestControllerHost, TestElementHost } from './testHost.js'

const providerTagName = 'test-query-client-provider-mutation'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

let explicitMutationClient: QueryClient | undefined

const contextMutationKey = queryKey()

class ContextMutationHostElement extends TestElementHost {
  readonly mutationKey = contextMutationKey

  readonly mutation = createMutationController(
    this,
    {
      mutationKey: this.mutationKey,
      mutationFn: (value: number) => sleep(10).then(() => value + 1),
    },
    explicitMutationClient,
  )
}

const contextMutationTagName = 'test-context-mutation-host'
if (!customElements.get(contextMutationTagName)) {
  customElements.define(contextMutationTagName, ContextMutationHostElement)
}

describe('createMutationController', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should resolve from the pre-connect placeholder state on the first provider connection', async () => {
    const consumer = document.createElement(
      contextMutationTagName,
    ) as ContextMutationHostElement

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

    document.body.append(provider)
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
    const providerClient = new QueryClient()
    explicitMutationClient = queryClient

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = providerClient

    const consumer = document.createElement(
      contextMutationTagName,
    ) as ContextMutationHostElement
    provider.append(consumer)

    document.body.append(provider)
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
    explicitMutationClient = undefined
    await Promise.resolve()
  })

  it('should support mutate and mutateAsync paths', async () => {
    const host = new TestControllerHost()

    const mutation = createMutationController(
      host,
      {
        mutationFn: (value: number) => sleep(10).then(() => value + 1),
      },
      queryClient,
    )

    host.connect()
    host.update()

    const resultPromise = mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(resultPromise).resolves.toBe(2)
    expect(mutation().isSuccess).toBe(true)
    expect(mutation().data).toBe(2)

    mutation.mutate(2)
    await vi.advanceTimersByTimeAsync(10)
    expect(mutation().data).toBe(3)
    expect(mutation().isSuccess).toBe(true)
  })

  it('should cover idle/pending/success/error mutation state transitions', async () => {
    const host = new TestControllerHost()

    const mutation = createMutationController(
      host,
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

    host.connect()
    host.update()

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
    const host = new TestControllerHost()

    const mutation = createMutationController(
      host,
      {
        mutationFn: () =>
          sleep(10).then(() => Promise.reject(new Error('reset-target'))),
      },
      queryClient,
    )

    host.connect()
    host.update()

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
    const host = new TestControllerHost()

    const mutation = createMutationController(
      host,
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

    host.connect()
    host.update()

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
    const host = new TestControllerHost()
    const callbackEvents: string[] = []

    const mutation = createMutationController(
      host,
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

    host.connect()
    host.update()

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
    const host = new TestControllerHost()
    const callbackEvents: string[] = []
    let version = 'v1'

    const mutation = createMutationController(
      host,
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

    host.connect()
    host.update()

    const successPromise = mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(successPromise).resolves.toBe(2)
    expect(callbackEvents.slice(0, 2)).toEqual(['success:v1', 'settled:v1'])

    version = 'v2'
    host.update()

    await Promise.all([
      expect(mutation.mutateAsync(-1)).rejects.toThrow('freshness-failure'),
      vi.advanceTimersByTimeAsync(10),
    ])
    expect(callbackEvents.slice(2)).toEqual(['error:v2', 'settled:v2'])
  })

  it('should become a deterministic missing-client state when the provider is missing', async () => {
    const consumer = document.createElement(
      contextMutationTagName,
    ) as ContextMutationHostElement
    const placeholderResult = consumer.mutation()

    expect(placeholderResult.isIdle).toBe(true)
    expect(placeholderResult.isPaused).toBe(false)

    document.body.append(consumer)

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
    const consumer = document.createElement(
      contextMutationTagName,
    ) as ContextMutationHostElement

    document.body.append(consumer)

    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.mutation()).toThrow(/No QueryClient available/)

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)

    document.body.append(provider)
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

    // Create a host that simulates Lit's behavior: addController calls
    // hostConnected immediately if the host is already connected
    class AlreadyConnectedHost {
      private readonly controllers = new Set<{
        hostConnected?: () => void
      }>()
      private isConnected = true
      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

      addController(controller: { hostConnected?: () => void }): void {
        this.controllers.add(controller)
        if (this.isConnected) {
          controller.hostConnected?.()
        }
      }

      removeController(controller: { hostConnected?: () => void }): void {
        this.controllers.delete(controller)
      }

      requestUpdate(): void {
        this.updatesRequested += 1
      }
    }

    const host = new AlreadyConnectedHost()

    // This should NOT throw even though hostConnected runs during construction
    const mutation = createMutationController(
      host,
      {
        mutationKey: queryKey(),
        mutationFn: (value: number) => sleep(10).then(() => value * 2),
      },
      queryClient,
    )

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

    class DeferredExplicitMutationHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()

      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

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

      addController(controller: ReactiveController): void {
        this.controllers.add(controller)
      }

      removeController(controller: ReactiveController): void {
        this.controllers.delete(controller)
      }

      requestUpdate(): void {
        this.updatesRequested += 1
      }
    }

    expect(() => new DeferredExplicitMutationHost()).not.toThrow()

    const host = new DeferredExplicitMutationHost()
    expect(host.mutation().isIdle).toBe(true)

    host.mutation.destroy()
  })
})
