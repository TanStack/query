import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createMutationController } from '../createMutationController.js'
import {
  TestControllerHost,
  TestElementHost,
  waitFor,
  waitForMissingQueryClient,
} from './testHost.js'

const providerTagName = 'test-query-client-provider-mutation'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

let explicitMutationClient: QueryClient | undefined

class ContextMutationHostElement extends TestElementHost {
  readonly mutationKey = ['context-mutation'] as const

  readonly mutation = createMutationController(
    this,
    {
      mutationKey: this.mutationKey,
      mutationFn: async (value: number) => value + 1,
    },
    explicitMutationClient,
  )
}

const contextMutationTagName = 'test-context-mutation-host'
if (!customElements.get(contextMutationTagName)) {
  customElements.define(contextMutationTagName, ContextMutationHostElement)
}

describe('createMutationController', () => {
  it('LC-MUT-01: first provider connection resolves from the pre-connect placeholder state', async () => {
    const consumer = document.createElement(
      contextMutationTagName,
    ) as ContextMutationHostElement

    expect(consumer.mutation().isIdle).toBe(true)
    expect(() => consumer.mutation.mutate(1)).toThrowError(
      /No QueryClient available/,
    )
    await expect(consumer.mutation.mutateAsync(1)).rejects.toThrow(
      /No QueryClient available/,
    )

    const client = new QueryClient()
    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = client
    provider.append(consumer)

    document.body.append(provider)
    await provider.updateComplete
    await Promise.resolve()

    await expect(consumer.mutation.mutateAsync(1)).resolves.toBe(2)
    expect(consumer.mutation().isSuccess).toBe(true)

    consumer.mutation.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('LC-MUT-02: explicit client takes precedence over provider context', async () => {
    const explicitClient = new QueryClient()
    const providerClient = new QueryClient()
    explicitMutationClient = explicitClient

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

    await expect(consumer.mutation.mutateAsync(2)).resolves.toBe(3)

    expect(
      explicitClient
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

  it('supports mutate and mutateAsync paths', async () => {
    const client = new QueryClient()
    const host = new TestControllerHost()

    const mutation = createMutationController(
      host,
      {
        mutationFn: async (value: number) => value + 1,
      },
      client,
    )

    host.connect()
    host.update()

    const result = await mutation.mutateAsync(1)
    expect(result).toBe(2)
    expect(mutation().isSuccess).toBe(true)
    expect(mutation().data).toBe(2)

    mutation.mutate(2)
    await waitFor(() => mutation().data === 3)
    expect(mutation().isSuccess).toBe(true)
  })

  it('M9: mutation state transitions cover idle/pending/success/error', async () => {
    const client = new QueryClient()
    const host = new TestControllerHost()

    const mutation = createMutationController(
      host,
      {
        mutationFn: async (value: number) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          if (value < 0) {
            throw new Error('negative-not-allowed')
          }
          return value + 1
        },
      },
      client,
    )

    host.connect()
    host.update()

    expect(mutation().isIdle).toBe(true)

    const successPromise = mutation.mutateAsync(10)
    await waitFor(() => mutation().isPending)
    await expect(successPromise).resolves.toBe(11)
    await waitFor(() => mutation().isSuccess)
    expect(mutation().data).toBe(11)

    const errorPromise = mutation.mutateAsync(-1)
    await waitFor(() => mutation().isPending)
    await expect(errorPromise).rejects.toThrow('negative-not-allowed')
    await waitFor(() => mutation().isError)
    expect(mutation().error).toBeInstanceOf(Error)
  })

  it('M10: reset clears mutation state back to idle baseline', async () => {
    const client = new QueryClient()
    const host = new TestControllerHost()

    const mutation = createMutationController(
      host,
      {
        mutationFn: async () => {
          throw new Error('reset-target')
        },
      },
      client,
    )

    host.connect()
    host.update()

    await expect(mutation.mutateAsync(undefined)).rejects.toThrow(
      'reset-target',
    )
    await waitFor(() => mutation().isError)
    expect(mutation().error).toBeInstanceOf(Error)

    mutation.reset()
    expect(mutation().isIdle).toBe(true)
    expect(mutation().isPaused).toBe(false)
    expect(mutation().isError).toBe(false)
    expect(mutation().error).toBeNull()
    expect(mutation().data).toBeUndefined()
  })

  it('M11: mutate is non-throwing while mutateAsync rejects on error', async () => {
    const client = new QueryClient()
    const host = new TestControllerHost()

    const mutation = createMutationController(
      host,
      {
        mutationFn: async (value: number) => {
          if (value < 0) {
            throw new Error('negative-not-allowed')
          }

          return value + 1
        },
      },
      client,
    )

    host.connect()
    host.update()

    expect(() => mutation.mutate(-1)).not.toThrow()
    await waitFor(() => mutation().isError)
    expect(mutation().error).toBeInstanceOf(Error)

    await expect(mutation.mutateAsync(-1)).rejects.toThrow(
      'negative-not-allowed',
    )
  })

  it('M12: mutation callback order and call counts are deterministic', async () => {
    const client = new QueryClient()
    const host = new TestControllerHost()
    const callbackEvents: string[] = []

    const mutation = createMutationController(
      host,
      {
        mutationFn: async (value: number) => {
          await new Promise((resolve) => setTimeout(resolve, 5))
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
      client,
    )

    host.connect()
    host.update()

    await expect(mutation.mutateAsync(1)).resolves.toBe(2)
    await expect(mutation.mutateAsync(-1)).rejects.toThrow(
      'callback-order-failure',
    )

    expect(callbackEvents).toEqual([
      'success:1',
      'settled:1',
      'error:-1',
      'settled:-1',
    ])
  })

  it('AREACT-02: refreshed mutation callbacks use latest closures', async () => {
    const client = new QueryClient()
    const host = new TestControllerHost()
    const callbackEvents: string[] = []
    let version = 'v1'

    const mutation = createMutationController(
      host,
      () => ({
        mutationFn: async (value: number) => {
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
      client,
    )

    host.connect()
    host.update()

    await expect(mutation.mutateAsync(1)).resolves.toBe(2)
    expect(callbackEvents.slice(0, 2)).toEqual(['success:v1', 'settled:v1'])

    version = 'v2'
    host.update()

    await expect(mutation.mutateAsync(-1)).rejects.toThrow('freshness-failure')
    expect(callbackEvents.slice(2)).toEqual(['error:v2', 'settled:v2'])
  })

  it('LC-MUT-03: missing provider becomes a deterministic missing-client state', async () => {
    const consumer = document.createElement(
      contextMutationTagName,
    ) as ContextMutationHostElement
    const placeholderResult = consumer.mutation()

    expect(placeholderResult.isIdle).toBe(true)
    expect(placeholderResult.isPaused).toBe(false)

    document.body.append(consumer)

    expect(() => consumer.mutation()).not.toThrow()
    await waitForMissingQueryClient(() => consumer.mutation())

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

  it('LC-MUT-04: later valid provider adoption recovers without reconstruction', async () => {
    const consumer = document.createElement(
      contextMutationTagName,
    ) as ContextMutationHostElement

    document.body.append(consumer)
    await waitForMissingQueryClient(() => consumer.mutation())

    const client = new QueryClient()
    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = client
    provider.append(consumer)

    document.body.append(provider)
    await provider.updateComplete
    await Promise.resolve()

    await expect(consumer.mutation.mutateAsync(1)).resolves.toBe(2)
    expect(consumer.mutation().isSuccess).toBe(true)

    consumer.mutation.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('ALREADYCONN-MUT-01: mutation controller on already-connected host with explicit client does not throw', async () => {
    // Regression test for SSR hydration scenario where controller is created
    // during willUpdate on an already-connected host.
    const client = new QueryClient()

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
        mutationKey: ['already-connected-mutation-test'],
        mutationFn: async (value: number) => value * 2,
      },
      client,
    )

    // Wait for the deferred onConnected to complete
    await Promise.resolve()
    await Promise.resolve()

    // Mutation controller should work correctly
    expect(mutation().isIdle).toBe(true)
    await expect(mutation.mutateAsync(5)).resolves.toBe(10)
    expect(mutation().isSuccess).toBe(true)

    mutation.destroy()
  })

  it('LC-MUT-05: explicit-client mutation accessors defer until host fields are initialized', () => {
    const client = new QueryClient()

    class DeferredExplicitMutationHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()

      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

      readonly mutation = createMutationController(
        this,
        () => ({
          mutationKey: ['deferred-explicit-mutation', this.id] as const,
          mutationFn: async (value: number) => value + this.offset,
        }),
        client,
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
