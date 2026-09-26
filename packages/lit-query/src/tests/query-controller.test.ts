import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { keepPreviousData, QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createQueryController } from '../createQueryController.js'
import { TestControllerHost } from './testHost.js'

const providerTagName = 'test-query-client-provider-query'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

const consumerKey = queryKey()

class QueryConsumerHostElement
  extends HTMLElement
  implements ReactiveControllerHost
{
  private readonly controllers = new Set<ReactiveController>()

  updatesRequested = 0
  readonly updateComplete: Promise<boolean> = Promise.resolve(true)
  readonly queryKey = consumerKey
  queryCalls = 0

  readonly query = createQueryController(this, () => ({
    queryKey: this.queryKey,
    queryFn: () => {
      this.queryCalls += 1
      return sleep(10).then(() => `value-${this.queryCalls}`)
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
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not request update after destroy when microtask flushes', async () => {
    const key = queryKey()
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
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'done'),
      },
      client,
    )

    host.connect()
    query.destroy()
    await Promise.resolve()
    await Promise.resolve()
    expect(host.updatesRequested).toBe(0)
  })

  it('should return observer count to baseline after 100 lifecycle cycles', async () => {
    const key = queryKey()
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
          queryKey: key,
          queryFn: () => sleep(10).then(() => cycle),
        },
        client,
      )

      host.connect()
      host.update()
      await vi.advanceTimersByTimeAsync(10)
      expect(query().isSuccess).toBe(true)

      const cacheQuery = client.getQueryCache().find({ queryKey: key })
      expect(cacheQuery?.getObserversCount()).toBe(1)

      host.disconnect()
      query.destroy()
      expect(cacheQuery?.getObserversCount() ?? 0).toBe(0)
    }
  })

  it('should fetch and update query state', async () => {
    const key = queryKey()
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
        queryKey: key,
        queryFn: () => {
          callCount += 1
          return sleep(10).then(() => ({ id: 1, name: 'Ada' }))
        },
      },
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toEqual({ id: 1, name: 'Ada' })
    expect(callCount).toBe(1)
    expect(host.updatesRequested).toBeGreaterThan(0)
  })

  it('should not request another update when stable function options refresh during host update', async () => {
    const key = queryKey()
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
      () => ({
        queryKey: key,
        queryFn: () => {
          callCount += 1
          return sleep(10).then(() => 'stable-result')
        },
        staleTime: Infinity,
      }),
      client,
    )

    try {
      host.connect()
      host.update()

      await vi.advanceTimersByTimeAsync(10)
      expect(query().isSuccess).toBe(true)

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        host.update()
        await Promise.resolve()
      }

      expect(host.updatesRequested).toBe(0)
      expect(query().data).toBe('stable-result')
      expect(callCount).toBe(1)
    } finally {
      query.destroy()
    }
  })

  it('should not request an update for refetch-only state changes when only data was read', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    const host = new TestControllerHost()
    let resolveRefetch: (() => void) | undefined

    const query = createQueryController(
      host,
      {
        queryKey: key,
        initialData: 'stable-data',
        staleTime: Infinity,
        queryFn: () =>
          new Promise<string>((resolve) => {
            resolveRefetch = () => resolve('stable-data')
          }),
      },
      client,
    )

    try {
      host.connect()
      host.update()

      expect(query().data).toBe('stable-data')
      await Promise.resolve()
      await Promise.resolve()

      host.updatesRequested = 0

      const refetch = query.refetch()
      expect(resolveRefetch).toBeDefined()
      await Promise.resolve()
      expect(host.updatesRequested).toBe(0)

      resolveRefetch!()
      await refetch
      await Promise.resolve()
      expect(host.updatesRequested).toBe(0)
    } finally {
      query.destroy()
    }
  })

  it('should refresh a suppressed result on the next accessor read when a newly read property changed', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    const host = new TestControllerHost()

    const query = createQueryController(
      host,
      {
        queryKey: key,
        initialData: 'initial-data',
        staleTime: Infinity,
        queryFn: async () => 'unused',
      },
      client,
    )

    try {
      host.connect()
      host.update()

      expect(query().status).toBe('success')
      await Promise.resolve()
      await Promise.resolve()

      host.updatesRequested = 0

      client.setQueryData(key, 'updated-data')

      await Promise.resolve()
      expect(host.updatesRequested).toBe(0)

      expect(query().data).toBe('updated-data')
      expect(host.updatesRequested).toBe(0)
    } finally {
      query.destroy()
    }
  })

  it('should transition from pending to success with expected contract', async () => {
    const key = queryKey()
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
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'ok'),
      },
      client,
    )

    expect(query().status).toBe('pending')
    expect(query().isSuccess).toBe(false)

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().status).toBe('success')
    expect(query().data).toBe('ok')
  })

  it('should not fetch when enabled=false and fetch after enabling', async () => {
    const key = queryKey()
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
        queryKey: key,
        enabled,
        queryFn: () => {
          callCount += 1
          return sleep(10).then(() => 'enabled-result')
        },
      }),
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(callCount).toBe(0)
    expect(query().isSuccess).toBe(false)

    enabled = true
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(callCount).toBe(1)
    expect(query().data).toBe('enabled-result')
  })

  it('should not leak observers and should refetch on remount with gcTime=0', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    let callCount = 0

    const firstHost = new TestControllerHost()
    const firstQuery = createQueryController(
      firstHost,
      {
        queryKey: key,
        gcTime: 0,
        queryFn: () => {
          callCount += 1
          return sleep(10).then(() => `value-${callCount}`)
        },
      },
      client,
    )

    firstHost.connect()
    firstHost.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(firstQuery().isSuccess).toBe(true)

    const firstCacheEntry = client.getQueryCache().find({ queryKey: key })
    expect(firstCacheEntry?.getObserversCount()).toBe(1)
    expect(callCount).toBe(1)

    firstHost.disconnect()
    firstQuery.destroy()
    // With gcTime:0, cache entry may be immediately removed after last observer unmounts.
    expect(
      client.getQueryCache().find({ queryKey: key })?.getObserversCount() ?? 0,
    ).toBe(0)

    const secondHost = new TestControllerHost()
    const secondQuery = createQueryController(
      secondHost,
      {
        queryKey: key,
        gcTime: 0,
        queryFn: () => {
          callCount += 1
          return sleep(10).then(() => `value-${callCount}`)
        },
      },
      client,
    )

    secondHost.connect()
    secondHost.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(secondQuery().isSuccess).toBe(true)
    expect(secondQuery().data).toBe('value-2')

    const secondCacheEntry = client.getQueryCache().find({ queryKey: key })
    expect(secondCacheEntry?.getObserversCount()).toBe(1)
    expect(callCount).toBe(2)
    expect(secondQuery().data).toBe('value-2')
  })

  it('should apply latest accessor key/options on updates and refetch', async () => {
    const key = queryKey()
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
        queryKey: [...key, keyId],
        queryFn: ({ queryKey }) => {
          const id = queryKey[1] as number
          seenKeys.push(id)
          return sleep(10).then(() => `user-${id}`)
        },
      }),
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('user-1')

    keyId = 2
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('user-2')

    const refetchPromise = query.refetch()
    await vi.advanceTimersByTimeAsync(10)
    await expect(refetchPromise).resolves.toMatchObject({ data: 'user-2' })
    expect(query().data).toBe('user-2')
    expect(seenKeys.includes(1)).toBe(true)
    expect(seenKeys.includes(2)).toBe(true)
  })

  it('should not request a host update when function options resolve to an unchanged result', async () => {
    const key = queryKey()
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
      () => ({
        queryKey: key,
        staleTime: Infinity,
        queryFn: () => {
          callCount += 1
          return sleep(10).then(() => 'stable')
        },
      }),
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    await Promise.resolve()
    await Promise.resolve()
    const updatesAfterSuccess = host.updatesRequested

    host.update()

    await Promise.resolve()
    await Promise.resolve()
    expect(query().data).toBe('stable')
    expect(callCount).toBe(1)
    expect(host.updatesRequested).toBe(updatesAfterSuccess)
  })

  it('should follow the stale-vs-fresh policy for refetchOnMount', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    let staleCalls = 0
    const staleKey = queryKey()

    const staleHostA = new TestControllerHost()
    const staleQueryA = createQueryController(
      staleHostA,
      {
        queryKey: staleKey,
        staleTime: 0,
        refetchOnMount: true,
        queryFn: () => {
          staleCalls += 1
          return sleep(10).then(() => `stale-${staleCalls}`)
        },
      },
      client,
    )

    staleHostA.connect()
    staleHostA.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(staleQueryA().isSuccess).toBe(true)
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
        queryFn: () => {
          staleCalls += 1
          return sleep(10).then(() => `stale-${staleCalls}`)
        },
      },
      client,
    )

    staleHostB.connect()
    staleHostB.update()

    await vi.advanceTimersByTimeAsync(0)
    expect(staleCalls).toBe(2)
    expect(staleQueryB().isSuccess).toBe(true)

    staleHostB.disconnect()
    staleQueryB.destroy()

    let freshCalls = 0
    const freshKey = queryKey()

    const freshHostA = new TestControllerHost()
    const freshQueryA = createQueryController(
      freshHostA,
      {
        queryKey: freshKey,
        staleTime: Number.POSITIVE_INFINITY,
        refetchOnMount: true,
        queryFn: () => {
          freshCalls += 1
          return sleep(10).then(() => `fresh-${freshCalls}`)
        },
      },
      client,
    )

    freshHostA.connect()
    freshHostA.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(freshQueryA().isSuccess).toBe(true)
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
        queryFn: () => {
          freshCalls += 1
          return sleep(10).then(() => `fresh-${freshCalls}`)
        },
      },
      client,
    )

    freshHostB.connect()
    freshHostB.update()

    expect(freshQueryB().isSuccess).toBe(true)
    await vi.advanceTimersByTimeAsync(10)
    expect(freshCalls).toBe(1)
    expect(freshQueryB().data).toBe('fresh-1')
  })

  it('should transform data with select and surface a throwing select as an error', async () => {
    const key = queryKey()
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
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ value: 2 })),
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

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe(20)

    shouldThrow = true
    const refetchPromise = query.refetch()
    await vi.advanceTimersByTimeAsync(10)
    await expect(refetchPromise).resolves.toMatchObject({ isError: true })
    expect(query().isError).toBe(true)
    expect(query().error).toBeInstanceOf(Error)
    expect((query().error as Error).message).toContain('select-failed')
  })

  it('should preserve prior data during key transitions with keepPreviousData', async () => {
    const key = queryKey()
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
        queryKey: [...key, keyId],
        queryFn: async ({ queryKey }) => {
          const id = queryKey[1] as number
          if (id === 1) {
            return sleep(10).then(() => 'value-1')
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

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('value-1')

    keyId = 2
    host.update()

    expect(query().isFetching).toBe(true)
    expect(query().isPlaceholderData).toBe(true)
    expect(query().data).toBe('value-1')

    resolveSecond?.('value-2')
    await vi.advanceTimersByTimeAsync(0)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('value-2')
    expect(query().isPlaceholderData).toBe(false)
  })

  it('should refetch and update result state on invalidation', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    const key = queryKey()
    let callCount = 0

    const query = createQueryController(
      host,
      {
        queryKey: key,
        queryFn: () => {
          callCount += 1
          return sleep(10).then(() => `v${callCount}`)
        },
      },
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('v1')
    expect(callCount).toBe(1)

    void client.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(10)
    expect(callCount).toBe(2)
    expect(query().data).toBe('v2')
    expect(query().isSuccess).toBe(true)
  })

  it('should not overwrite a newer key result with a stale older response', async () => {
    const key = queryKey()
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
        queryKey: [...key, keyId],
        queryFn: async ({ queryKey }) => {
          const id = queryKey[1] as string
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

    await vi.advanceTimersByTimeAsync(0)
    expect(resolveOld).toBeTypeOf('function')

    keyId = 'new'
    host.update()

    expect(resolveNew).toBeTypeOf('function')

    resolveNew?.('new-value')
    await vi.advanceTimersByTimeAsync(0)
    expect(query().data).toBe('new-value')

    resolveOld?.('old-value')
    await vi.advanceTimersByTimeAsync(0)
    expect(query().data).toBe('new-value')
    expect(query().isSuccess).toBe(true)
  })

  it('should pass an AbortSignal to queryFn and abort the prior request on key switch', async () => {
    const key = queryKey()
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
        queryKey: [...key, keyId],
        queryFn: async ({ signal, queryKey }) => {
          const id = queryKey[1] as 'old' | 'new'
          if (id === 'old') {
            oldSignal = signal
            return new Promise<string>((resolve) => {
              resolveOld = resolve
              signal.addEventListener('abort', () => resolve('old-aborted'), {
                once: true,
              })
            })
          }

          return sleep(10).then(() => 'new-success')
        },
      }),
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(0)
    expect(oldSignal).toBeInstanceOf(AbortSignal)
    expect(oldSignal?.aborted).toBe(false)

    keyId = 'new'
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().data).toBe('new-success')
    expect(oldSignal?.aborted).toBe(true)

    resolveOld?.('old-late')
    await vi.advanceTimersByTimeAsync(0)
    expect(query().data).toBe('new-success')
  })

  it('should maintain a stable final state without duplicate observers under rapid key churn', async () => {
    const key = queryKey()
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
        queryKey: [...key, keyId],
        queryFn: async ({ queryKey }) => {
          const id = queryKey[1] as number
          await sleep(Math.max(1, 20 - id))
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

    await vi.advanceTimersByTimeAsync(1)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('result-20')

    const latestCacheEntry = client
      .getQueryCache()
      .find({ queryKey: [...key, 20] })
    expect(latestCacheEntry?.getObserversCount()).toBe(1)
  })

  it('should not process detached updates when disconnected while in-flight', async () => {
    const key = queryKey()
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
        queryKey: key,
        queryFn: () =>
          new Promise<string>((resolve) => {
            resolveFetch = resolve
          }),
      },
      client,
    )

    host.connect()
    host.update()

    expect(query().isFetching).toBe(true)

    host.disconnect()
    await Promise.resolve()
    const updatesAfterDisconnect = host.updatesRequested

    resolveFetch?.('late-value')
    await vi.advanceTimersByTimeAsync(0)
    expect(host.updatesRequested).toBe(updatesAfterDisconnect)
  })

  it('should yield a correct snapshot when reconnecting after an in-flight request settles', async () => {
    const key = queryKey()
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
        queryKey: key,
        queryFn: () =>
          new Promise<string>((resolve) => {
            resolveFetch = resolve
          }),
      },
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(0)
    expect(query().isFetching).toBe(true)

    host.disconnect()
    resolveFetch?.('reconnected-value')
    await vi.advanceTimersByTimeAsync(0)

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(0)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('reconnected-value')
  })

  it('should use the latest select closure after host updates', async () => {
    const key = queryKey()
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
        queryKey: key,
        queryFn: () => sleep(10).then(() => 2),
        select: (value: number) => value * multiplier,
      }),
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe(2)

    multiplier = 3
    host.update()

    expect(query().data).toBe(6)

    multiplier = 4
    host.update()
    const refetchPromise = query.refetch()
    await vi.advanceTimersByTimeAsync(10)
    await expect(refetchPromise).resolves.toMatchObject({ data: 8 })
    expect(query().data).toBe(8)
  })

  it('should switch provider client while connected with a single active observer', async () => {
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
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.queryCalls).toBe(1)

    const oldCacheQueryBeforeSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(oldCacheQueryBeforeSwitch?.getObserversCount()).toBe(1)

    provider.client = clientB
    await provider.updateComplete
    await vi.advanceTimersByTimeAsync(10)

    const oldCacheQueryAfterSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    const newCacheQueryAfterSwitch = clientB
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })

    expect(oldCacheQueryAfterSwitch?.getObserversCount() ?? 0).toBe(0)
    expect(newCacheQueryAfterSwitch?.getObserversCount()).toBe(1)

    void clientB.invalidateQueries({ queryKey: consumer.queryKey })
    expect(consumer.queryCalls).toBe(3)

    consumer.query.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should track retry failure metadata before eventual success', async () => {
    const key = queryKey()
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
        queryKey: key,
        retry: 2,
        retryDelay: 30,
        queryFn: async () => {
          attempts += 1
          await sleep(10)
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

    await vi.advanceTimersByTimeAsync(10)
    expect(query().failureCount).toBe(1)
    expect(query().failureReason).toBeInstanceOf(Error)
    expect(query().isPending || query().isError).toBe(true)
    await vi.advanceTimersByTimeAsync(80)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('success')
    expect(attempts).toBe(3)
  })

  it('should be reconnect-idempotent without duplicate subscriptions', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    const key = queryKey()

    const query = createQueryController(
      host,
      {
        queryKey: key,
        queryFn: () => sleep(10).then(() => ['a', 'b']),
      },
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)

    const cacheQuery = client.getQueryCache().find({ queryKey: key })
    expect(cacheQuery?.state.data).toEqual(['a', 'b'])
    expect(cacheQuery?.getObserversCount()).toBe(1)

    host.disconnect()
    expect(cacheQuery?.getObserversCount()).toBe(0)

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(0)
    expect(cacheQuery?.getObserversCount()).toBe(1)

    host.connect()
    host.update()

    expect(cacheQuery?.getObserversCount()).toBe(1)
  })

  it('should be safe before provider resolution in the no-explicit-client constructor path', async () => {
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

    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.queryCalls).toBe(1)
    expect(consumer.query().data).toBe('value-1')

    consumer.query.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should not spuriously throw during the handshake on the first provider-backed connection', async () => {
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
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.query().data).toBe('value-1')

    consumer.query.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should throw after the initial placeholder phase when no provider is available', async () => {
    const consumer = document.createElement(
      consumerTagName,
    ) as QueryConsumerHostElement

    expect(consumer.query().status).toBe('pending')

    document.body.append(consumer)

    expect(() => consumer.query()).not.toThrow()
    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.query()).toThrow(/No QueryClient available/)
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

  it('should share the missing-client contract between wrapper and result-object imperative methods', async () => {
    const consumer = document.createElement(
      consumerTagName,
    ) as QueryConsumerHostElement
    const placeholderResult = consumer.query()

    document.body.append(consumer)

    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.query()).toThrow(/No QueryClient available/)
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

  it('should clear stale provider-derived client state when reconnecting outside any provider', async () => {
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
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(
      client
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount(),
    ).toBe(1)

    provider.removeChild(consumer)
    expect(
      client
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount() ?? 0,
    ).toBe(0)

    consumer.connectedCallback()

    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.query.destroy()
    consumer.remove()
    provider.remove()
    await Promise.resolve()
  })

  it('should rebind cleanly with later recovery when reconnecting under a different provider', async () => {
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
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)

    providerA.removeChild(consumer)
    expect(
      clientA
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount() ?? 0,
    ).toBe(0)

    consumer.connectedCallback()
    await expect(consumer.query.refetch()).rejects.toThrow(
      /No QueryClient available/,
    )

    consumer.disconnectedCallback()
    providerB.append(consumer)
    document.body.append(providerB)
    await providerB.updateComplete

    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.queryCalls).toBe(3)
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

  it('should reuse hydrated data on an already-connected host without an eager refetch', async () => {
    const key = queryKey()
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    })
    let queryFnCalls = 0

    client.setQueryData(key, 'hydrated-value')

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
        queryKey: key,
        queryFn: () => {
          queryFnCalls += 1
          return sleep(10).then(() => 'fetched-value')
        },
        staleTime: 30_000,
      },
      client,
    )

    await Promise.resolve()
    await Promise.resolve()
    expect(query().data).toBe('hydrated-value')
    expect(query().isSuccess).toBe(true)
    expect(queryFnCalls).toBe(0)

    const refetchPromise = query.refetch()
    await vi.advanceTimersByTimeAsync(10)
    await expect(refetchPromise).resolves.toMatchObject({
      data: 'fetched-value',
    })
    expect(query().data).toBe('fetched-value')
    expect(queryFnCalls).toBe(1)

    query.destroy()
  })

  it('should defer explicit-client query accessors until host fields are initialized', () => {
    const key = queryKey()
    const client = new QueryClient()

    class DeferredExplicitQueryHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()

      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

      readonly query = createQueryController(
        this,
        () => ({
          queryKey: [...key, this.id],
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
