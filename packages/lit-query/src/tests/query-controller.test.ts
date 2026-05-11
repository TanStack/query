import { describe, expect, it } from 'vitest'
import { keepPreviousData, QueryClient } from '@tanstack/query-core'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createQueryController } from '../createQueryController.js'
import {
  TestControllerHost,
  waitFor,
  waitForMissingQueryClient,
} from './testHost.js'

const providerTagName = 'test-query-client-provider-query'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

class QueryConsumerHostElement
  extends HTMLElement
  implements ReactiveControllerHost
{
  private readonly controllers = new Set<ReactiveController>()

  updatesRequested = 0
  readonly updateComplete: Promise<boolean> = Promise.resolve(true)
  readonly queryKey = ['query-controller', 'provider-switch'] as const
  queryCalls = 0

  readonly query = createQueryController(this, () => ({
    queryKey: this.queryKey,
    queryFn: async () => {
      this.queryCalls += 1
      return `value-${this.queryCalls}`
    },
    retry: false,
  }))

  addController(controller: ReactiveController): void {
    this.controllers.add(controller)
  }

  removeController(controller: ReactiveController): void {
    this.controllers.delete(controller)
  }

  requestUpdate(): void {
    this.updatesRequested += 1
  }

  connectedCallback(): void {
    for (const controller of this.controllers) {
      controller.hostConnected?.()
    }
  }

  disconnectedCallback(): void {
    for (const controller of this.controllers) {
      controller.hostDisconnected?.()
    }
  }
}

const consumerTagName = 'test-query-consumer-host'
if (!customElements.get(consumerTagName)) {
  customElements.define(consumerTagName, QueryConsumerHostElement)
}

describe('createQueryController', () => {
  it('M1: does not request update after destroy when microtask flushes', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    const query = createQueryController(
      host,
      {
        queryKey: ['query-controller', 'm1'],
        queryFn: async () => 'done',
      },
      client,
    )

    host.connect()
    query.destroy()

    await Promise.resolve()
    await Promise.resolve()

    expect(host.updatesRequested).toBe(0)
  })

  it('M2: returns observer count to baseline after 100 lifecycle cycles', async () => {
    const queryKey = ['query-controller', 'm2'] as const
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    for (let cycle = 0; cycle < 100; cycle += 1) {
      const host = new TestControllerHost()
      const query = createQueryController(
        host,
        {
          queryKey,
          queryFn: async () => cycle,
        },
        client,
      )

      host.connect()
      host.update()
      await waitFor(() => query().isSuccess)

      const cacheQuery = client.getQueryCache().find({ queryKey })
      expect(cacheQuery?.getObserversCount()).toBe(1)

      host.disconnect()
      query.destroy()
      expect(cacheQuery?.getObserversCount() ?? 0).toBe(0)
    }
  })

  it('fetches and updates query state', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let callCount = 0

    const query = createQueryController(
      host,
      {
        queryKey: ['user', 'fetches-and-updates'],
        queryFn: async () => {
          callCount += 1
          return { id: 1, name: 'Ada' }
        },
      },
      client,
    )

    host.connect()
    host.update()

    await waitFor(() => query().isSuccess)

    expect(query().data).toEqual({ id: 1, name: 'Ada' })
    expect(callCount).toBe(1)
    expect(host.updatesRequested).toBeGreaterThan(0)
  })

  it('M4: transitions from pending to success with expected contract', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    const query = createQueryController(
      host,
      {
        queryKey: ['query-controller', 'm4'],
        queryFn: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return 'ok'
        },
      },
      client,
    )

    expect(query().status).toBe('pending')
    expect(query().isSuccess).toBe(false)

    host.connect()
    host.update()

    await waitFor(() => query().isSuccess)
    expect(query().status).toBe('success')
    expect(query().data).toBe('ok')
  })

  it('M6: does not fetch when enabled=false and fetches after enabling', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let callCount = 0
    let enabled = false

    const query = createQueryController(
      host,
      () => ({
        queryKey: ['query-controller', 'm6'],
        enabled,
        queryFn: async () => {
          callCount += 1
          return 'enabled-result'
        },
      }),
      client,
    )

    host.connect()
    host.update()

    await new Promise((resolve) => setTimeout(resolve, 25))
    expect(callCount).toBe(0)
    expect(query().isSuccess).toBe(false)

    enabled = true
    host.update()
    await waitFor(() => query().isSuccess)

    expect(callCount).toBe(1)
    expect(query().data).toBe('enabled-result')
  })

  it('M7: remount with gcTime=0 has no observer leak and refetches', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const queryKey = ['query-controller', 'm7'] as const
    let callCount = 0

    const firstHost = new TestControllerHost()
    const firstQuery = createQueryController(
      firstHost,
      {
        queryKey,
        gcTime: 0,
        queryFn: async () => {
          callCount += 1
          return `value-${callCount}`
        },
      },
      client,
    )

    firstHost.connect()
    firstHost.update()
    await waitFor(() => firstQuery().isSuccess)

    const firstCacheEntry = client.getQueryCache().find({ queryKey })
    expect(firstCacheEntry?.getObserversCount()).toBe(1)
    expect(callCount).toBe(1)

    firstHost.disconnect()
    firstQuery.destroy()

    await waitFor(() => {
      // With gcTime:0, cache entry may be immediately removed after last observer unmounts.
      const entry = client.getQueryCache().find({ queryKey })
      return !entry || entry.getObserversCount() === 0
    })

    const secondHost = new TestControllerHost()
    const secondQuery = createQueryController(
      secondHost,
      {
        queryKey,
        gcTime: 0,
        queryFn: async () => {
          callCount += 1
          return `value-${callCount}`
        },
      },
      client,
    )

    secondHost.connect()
    secondHost.update()
    await waitFor(() => secondQuery().isSuccess)
    await waitFor(() => secondQuery().data === 'value-2')

    const secondCacheEntry = client.getQueryCache().find({ queryKey })
    expect(secondCacheEntry?.getObserversCount()).toBe(1)
    expect(callCount).toBe(2)
    expect(secondQuery().data).toBe('value-2')
  })

  it('M8: applies latest accessor key/options on updates and refetch', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let keyId = 1
    const seenKeys: number[] = []

    const query = createQueryController(
      host,
      () => ({
        queryKey: ['query-controller', keyId] as const,
        queryFn: async ({ queryKey }) => {
          const id = queryKey[1] as number
          seenKeys.push(id)
          return `user-${id}`
        },
      }),
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => query().isSuccess)
    expect(query().data).toBe('user-1')

    keyId = 2
    host.update()
    await waitFor(() => query().isSuccess && query().data === 'user-2')

    await query.refetch()
    expect(query().data).toBe('user-2')
    expect(seenKeys.includes(1)).toBe(true)
    expect(seenKeys.includes(2)).toBe(true)
  })

  it('QSEM-01: refetchOnMount follows stale-vs-fresh policy', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    let staleCalls = 0
    const staleKey = ['query-controller', 'qsem-01', 'stale'] as const

    const staleHostA = new TestControllerHost()
    const staleQueryA = createQueryController(
      staleHostA,
      {
        queryKey: staleKey,
        staleTime: 0,
        refetchOnMount: true,
        queryFn: async () => {
          staleCalls += 1
          return `stale-${staleCalls}`
        },
      },
      client,
    )

    staleHostA.connect()
    staleHostA.update()
    await waitFor(() => staleQueryA().isSuccess)
    expect(staleCalls).toBe(1)
    staleHostA.disconnect()
    staleQueryA.destroy()

    const staleHostB = new TestControllerHost()
    const staleQueryB = createQueryController(
      staleHostB,
      {
        queryKey: staleKey,
        staleTime: 0,
        refetchOnMount: true,
        queryFn: async () => {
          staleCalls += 1
          return `stale-${staleCalls}`
        },
      },
      client,
    )

    staleHostB.connect()
    staleHostB.update()
    await waitFor(() => staleCalls >= 2)
    expect(staleQueryB().isSuccess).toBe(true)
    staleHostB.disconnect()
    staleQueryB.destroy()

    let freshCalls = 0
    const freshKey = ['query-controller', 'qsem-01', 'fresh'] as const

    const freshHostA = new TestControllerHost()
    const freshQueryA = createQueryController(
      freshHostA,
      {
        queryKey: freshKey,
        staleTime: Number.POSITIVE_INFINITY,
        refetchOnMount: true,
        queryFn: async () => {
          freshCalls += 1
          return `fresh-${freshCalls}`
        },
      },
      client,
    )

    freshHostA.connect()
    freshHostA.update()
    await waitFor(() => freshQueryA().isSuccess)
    expect(freshCalls).toBe(1)
    freshHostA.disconnect()
    freshQueryA.destroy()

    const freshHostB = new TestControllerHost()
    const freshQueryB = createQueryController(
      freshHostB,
      {
        queryKey: freshKey,
        staleTime: Number.POSITIVE_INFINITY,
        refetchOnMount: true,
        queryFn: async () => {
          freshCalls += 1
          return `fresh-${freshCalls}`
        },
      },
      client,
    )

    freshHostB.connect()
    freshHostB.update()
    await waitFor(() => freshQueryB().isSuccess)
    await new Promise((resolve) => setTimeout(resolve, 25))
    expect(freshCalls).toBe(1)
    expect(freshQueryB().data).toBe('fresh-1')
  })

  it('QSEM-02: select transforms data and select-throw surfaces as error', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let shouldThrow = false

    const query = createQueryController(
      host,
      () => ({
        queryKey: ['query-controller', 'qsem-02'],
        queryFn: async () => ({ value: 2 }),
        select: (payload: { value: number }) => {
          if (shouldThrow) {
            throw new Error('select-failed')
          }

          return payload.value * 10
        },
      }),
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => query().isSuccess)
    expect(query().data).toBe(20)

    shouldThrow = true
    await query.refetch()
    await waitFor(() => query().isError)
    expect(query().error).toBeInstanceOf(Error)
    expect((query().error as Error).message).toContain('select-failed')
  })

  it('S5: keepPreviousData preserves prior data during key transitions', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let keyId = 1
    let resolveSecond: ((value: string) => void) | undefined

    const query = createQueryController(
      host,
      () => ({
        queryKey: ['query-controller', 's5', keyId] as const,
        queryFn: async ({ queryKey }) => {
          const id = queryKey[2] as number
          if (id === 1) {
            return 'value-1'
          }

          return new Promise<string>((resolve) => {
            resolveSecond = resolve
          })
        },
        placeholderData: keepPreviousData,
      }),
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => query().isSuccess && query().data === 'value-1')

    keyId = 2
    host.update()

    await waitFor(() => query().isFetching)
    await waitFor(() => query().isPlaceholderData)
    expect(query().data).toBe('value-1')

    resolveSecond?.('value-2')
    await waitFor(() => query().isSuccess && query().data === 'value-2')
    expect(query().isPlaceholderData).toBe(false)
  })

  it('QSEM-03: invalidation triggers refetch and updates result state', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    const queryKey = ['query-controller', 'qsem-03'] as const
    let callCount = 0

    const query = createQueryController(
      host,
      {
        queryKey,
        queryFn: async () => {
          callCount += 1
          return `v${callCount}`
        },
      },
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => query().isSuccess)
    expect(query().data).toBe('v1')
    expect(callCount).toBe(1)

    void client.invalidateQueries({ queryKey })
    await waitFor(() => callCount >= 2)
    await waitFor(() => query().data === 'v2')
    expect(query().isSuccess).toBe(true)
  })

  it('CANCEL-02: stale older response does not overwrite newer key result', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let keyId = 'old'
    let resolveOld: ((value: string) => void) | undefined
    let resolveNew: ((value: string) => void) | undefined

    const query = createQueryController(
      host,
      () => ({
        queryKey: ['query-controller', 'cancel-02', keyId] as const,
        queryFn: async ({ queryKey }) => {
          const id = queryKey[2] as string
          return new Promise<string>((resolve) => {
            if (id === 'old') {
              resolveOld = resolve
            } else {
              resolveNew = resolve
            }
          })
        },
      }),
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => typeof resolveOld === 'function')

    keyId = 'new'
    host.update()
    await waitFor(() => typeof resolveNew === 'function')

    resolveNew?.('new-value')
    await waitFor(() => query().data === 'new-value')

    resolveOld?.('old-value')
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(query().data).toBe('new-value')
    expect(query().isSuccess).toBe(true)
  })

  it('CANCEL-01: queryFn receives AbortSignal and prior request is aborted on key switch', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let keyId: 'old' | 'new' = 'old'
    let oldSignal: AbortSignal | undefined
    let resolveOld: ((value: string) => void) | undefined

    const query = createQueryController(
      host,
      () => ({
        queryKey: ['query-controller', 'cancel-01', keyId] as const,
        queryFn: async ({ signal, queryKey }) => {
          const id = queryKey[2] as 'old' | 'new'
          if (id === 'old') {
            oldSignal = signal
            return new Promise<string>((resolve) => {
              resolveOld = resolve
              signal.addEventListener('abort', () => resolve('old-aborted'), {
                once: true,
              })
            })
          }

          return 'new-success'
        },
      }),
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => typeof oldSignal !== 'undefined')

    expect(oldSignal).toBeInstanceOf(AbortSignal)
    expect(oldSignal?.aborted).toBe(false)

    keyId = 'new'
    host.update()
    await waitFor(() => query().data === 'new-success')

    expect(oldSignal?.aborted).toBe(true)
    resolveOld?.('old-late')
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(query().data).toBe('new-success')
  })

  it('S6: rapid key churn maintains stable final state without duplicate observers', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let keyId = 0

    const query = createQueryController(
      host,
      () => ({
        queryKey: ['query-controller', 's6', keyId] as const,
        queryFn: async ({ queryKey }) => {
          const id = queryKey[2] as number
          await new Promise((resolve) =>
            setTimeout(resolve, Math.max(1, 20 - id)),
          )
          return `result-${id}`
        },
      }),
      client,
    )

    host.connect()
    host.update()

    for (let i = 1; i <= 20; i += 1) {
      keyId = i
      host.update()
    }

    await waitFor(() => query().isSuccess && query().data === 'result-20')

    const latestCacheEntry = client
      .getQueryCache()
      .find({ queryKey: ['query-controller', 's6', 20] })
    expect(latestCacheEntry?.getObserversCount()).toBe(1)
  })

  it('LIFE-01: disconnect while in-flight does not process detached updates', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let resolveFetch: ((value: string) => void) | undefined

    const query = createQueryController(
      host,
      {
        queryKey: ['query-controller', 'life-01'],
        queryFn: () =>
          new Promise<string>((resolve) => {
            resolveFetch = resolve
          }),
      },
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => query().isFetching)

    host.disconnect()
    await Promise.resolve()
    const updatesAfterDisconnect = host.updatesRequested

    resolveFetch?.('late-value')
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(host.updatesRequested).toBe(updatesAfterDisconnect)
  })

  it('LIFE-02: reconnect after in-flight settle yields correct snapshot', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let resolveFetch: ((value: string) => void) | undefined

    const query = createQueryController(
      host,
      {
        queryKey: ['query-controller', 'life-02'],
        queryFn: () =>
          new Promise<string>((resolve) => {
            resolveFetch = resolve
          }),
      },
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => query().isFetching)

    host.disconnect()
    resolveFetch?.('reconnected-value')
    await new Promise((resolve) => setTimeout(resolve, 20))

    host.connect()
    host.update()
    await waitFor(() => query().isSuccess)
    expect(query().data).toBe('reconnected-value')
  })

  it('AREACT-01: latest select closure is used after host updates', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let multiplier = 1

    const query = createQueryController(
      host,
      () => ({
        queryKey: ['query-controller', 'areact-01'],
        queryFn: async () => 2,
        select: (value: number) => value * multiplier,
      }),
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => query().isSuccess)
    expect(query().data).toBe(2)

    multiplier = 3
    host.update()
    await waitFor(() => query().data === 6)

    multiplier = 4
    host.update()
    await query.refetch()
    expect(query().data).toBe(8)
  })

  it('M3: switches provider client while connected with a single active observer', async () => {
    const clientA = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const clientB = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = clientA

    const consumer = document.createElement(
      consumerTagName,
    ) as QueryConsumerHostElement
    provider.append(consumer)
    document.body.append(provider)

    await provider.updateComplete
    await consumer.updateComplete
    await waitFor(() => consumer.query().isSuccess && consumer.queryCalls >= 1)

    const oldCacheQueryBeforeSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(oldCacheQueryBeforeSwitch?.getObserversCount()).toBe(1)

    provider.client = clientB
    await provider.updateComplete

    await waitFor(() => {
      const newCacheQuery = clientB
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
      return Boolean(newCacheQuery && newCacheQuery.getObserversCount() === 1)
    })

    const oldCacheQueryAfterSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    const newCacheQueryAfterSwitch = clientB
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })

    expect(oldCacheQueryAfterSwitch?.getObserversCount() ?? 0).toBe(0)
    expect(newCacheQueryAfterSwitch?.getObserversCount()).toBe(1)

    void clientB.invalidateQueries({ queryKey: consumer.queryKey })
    await waitFor(() => consumer.queryCalls >= 2)

    consumer.query.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('M5: tracks retry failure metadata before eventual success', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let attempts = 0

    const query = createQueryController(
      host,
      {
        queryKey: ['query-controller', 'm5'],
        retry: 2,
        retryDelay: 30,
        queryFn: async () => {
          attempts += 1
          await new Promise((resolve) => setTimeout(resolve, 5))
          if (attempts < 3) {
            throw new Error(`attempt-${attempts}`)
          }
          return 'success'
        },
      },
      client,
    )

    host.connect()
    host.update()

    await waitFor(() => query().failureCount >= 1)
    expect(query().failureReason).toBeInstanceOf(Error)
    expect(query().isPending || query().isError).toBe(true)

    await waitFor(() => query().isSuccess)
    expect(query().data).toBe('success')
    expect(attempts).toBe(3)
  })

  it('is reconnect-idempotent without duplicate subscriptions', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    const queryKey = ['todos', 'reconnect-idempotent'] as const

    const query = createQueryController(
      host,
      {
        queryKey,
        queryFn: async () => ['a', 'b'],
      },
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => query().isSuccess)

    const cacheQuery = client.getQueryCache().find({ queryKey })
    expect(cacheQuery).toBeDefined()
    expect(cacheQuery?.getObserversCount()).toBe(1)

    host.disconnect()
    expect(cacheQuery?.getObserversCount()).toBe(0)

    host.connect()
    host.update()
    await waitFor(() => cacheQuery?.getObserversCount() === 1)

    host.connect()
    host.update()

    expect(cacheQuery?.getObserversCount()).toBe(1)
  })

  it('M17: no-explicit-client constructor path is safe before provider resolution', async () => {
    const consumer = document.createElement(
      consumerTagName,
    ) as QueryConsumerHostElement

    expect(consumer.query().status).toBe('pending')

    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = client
    provider.append(consumer)

    document.body.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    await waitFor(() => consumer.query().isSuccess)
    expect(consumer.query().data).toBeDefined()
    expect(consumer.queryCalls).toBeGreaterThan(0)

    consumer.query.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('LC-QUERY-01: provider-backed first connection does not spuriously throw during handshake', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = client

    const consumer = document.createElement(
      consumerTagName,
    ) as QueryConsumerHostElement
    provider.append(consumer)

    expect(() => consumer.query()).not.toThrow()

    document.body.append(provider)

    expect(() => consumer.query()).not.toThrow()

    await provider.updateComplete
    await consumer.updateComplete
    await waitFor(() => consumer.query().isSuccess)

    expect(consumer.query().data).toBeDefined()

    consumer.query.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('throws after the initial placeholder phase when no provider is available', async () => {
    const consumer = document.createElement(
      consumerTagName,
    ) as QueryConsumerHostElement

    expect(consumer.query().status).toBe('pending')

    document.body.append(consumer)

    expect(() => consumer.query()).not.toThrow()
    await waitForMissingQueryClient(() => consumer.query())

    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(consumer.query.suspense()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.query.destroy()
    consumer.remove()
    await Promise.resolve()
  })

  it('LC-QUERY-03: wrapper and result-object imperative methods share the missing-client contract', async () => {
    const consumer = document.createElement(
      consumerTagName,
    ) as QueryConsumerHostElement
    const placeholderResult = consumer.query()

    document.body.append(consumer)
    await waitForMissingQueryClient(() => consumer.query())

    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(placeholderResult.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.query.destroy()
    consumer.remove()
    await Promise.resolve()
  })

  it('LC-QUERY-04: reconnect outside any provider clears stale provider-derived client state', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = client

    const consumer = document.createElement(
      consumerTagName,
    ) as QueryConsumerHostElement
    provider.append(consumer)
    document.body.append(provider)

    await provider.updateComplete
    await consumer.updateComplete
    await waitFor(() => consumer.query().isSuccess)

    expect(
      client
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount(),
    ).toBe(1)

    provider.removeChild(consumer)
    await waitFor(
      () =>
        (client
          .getQueryCache()
          .find({ queryKey: consumer.queryKey })
          ?.getObserversCount() ?? 0) === 0,
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
    consumer.connectedCallback()

    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.query.destroy()
    consumer.remove()
    provider.remove()
    await Promise.resolve()
  })

  it('LC-QUERY-05: reconnect under a different provider rebinds cleanly with later recovery', async () => {
    const clientA = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const clientB = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const providerA = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    providerA.client = clientA
    const providerB = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    providerB.client = clientB

    const consumer = document.createElement(
      consumerTagName,
    ) as QueryConsumerHostElement
    providerA.append(consumer)

    document.body.append(providerA)

    await providerA.updateComplete
    await consumer.updateComplete
    await waitFor(() => consumer.query().isSuccess)

    providerA.removeChild(consumer)
    await waitFor(
      () =>
        (clientA
          .getQueryCache()
          .find({ queryKey: consumer.queryKey })
          ?.getObserversCount() ?? 0) === 0,
    )
    consumer.connectedCallback()
    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.disconnectedCallback()
    providerB.append(consumer)
    document.body.append(providerB)
    await providerB.updateComplete
    await waitFor(() => consumer.query().isSuccess && consumer.queryCalls >= 2)

    expect(
      clientA
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount() ?? 0,
    ).toBe(0)
    expect(
      clientB
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount(),
    ).toBe(1)
    expect(consumer.query().data).toBe(`value-${consumer.queryCalls}`)

    consumer.query.destroy()
    providerA.remove()
    providerB.remove()
    await Promise.resolve()
  })

  it('reuses hydrated data on an already-connected host without an eager refetch', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    })
    let queryFnCalls = 0

    client.setQueryData(['already-connected-test'], 'hydrated-value')

    // Simulate Lit's synchronous hostConnected call on already-connected hosts.
    class AlreadyConnectedHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()
      private isConnected = true
      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

      addController(controller: ReactiveController): void {
        this.controllers.add(controller)
        if (this.isConnected) {
          controller.hostConnected?.()
        }
      }

      removeController(controller: ReactiveController): void {
        this.controllers.delete(controller)
      }

      requestUpdate(): void {
        this.updatesRequested += 1
      }
    }

    const host = new AlreadyConnectedHost()

    const query = createQueryController(
      host,
      {
        queryKey: ['already-connected-test'],
        queryFn: async () => {
          queryFnCalls += 1
          return 'fetched-value'
        },
        staleTime: 30_000,
      },
      client,
    )

    await Promise.resolve()
    await Promise.resolve()

    expect(query().data).toBe('hydrated-value')
    expect(query().isSuccess).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(queryFnCalls).toBe(0)

    await query.refetch()
    await waitFor(() => query().data === 'fetched-value')
    expect(queryFnCalls).toBe(1)

    query.destroy()
  })

  it('defers explicit-client query accessors until host fields are initialized', () => {
    const client = new QueryClient()

    class DeferredExplicitQueryHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()

      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

      readonly query = createQueryController(
        this,
        () => ({
          queryKey: ['deferred-explicit-query', this.id] as const,
          queryFn: async () => this.id,
          retry: false,
        }),
        client,
      )

      readonly firstRead = this.query()
      readonly id = 'alpha'

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

    expect(() => new DeferredExplicitQueryHost()).not.toThrow()

    const host = new DeferredExplicitQueryHost()
    expect(host.query().status).toBe('pending')

    host.query.destroy()
  })
})
