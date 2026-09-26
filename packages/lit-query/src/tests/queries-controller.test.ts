import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createQueriesController } from '../createQueriesController.js'
import { queryOptions } from '../queryOptions.js'
import { TestControllerHost, TestElementHost } from './testHost.js'

const providerTagName = 'test-query-client-provider-queries'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

let explicitQueriesClient: QueryClient | undefined

const contextQueriesKey = queryKey()
const rawContextQueriesKey = queryKey()
const deferredFieldsQueriesKey = queryKey()

class ContextQueriesHostElement extends TestElementHost {
  readonly queryKeys = [
    [...contextQueriesKey, 'alpha'],
    [...contextQueriesKey, 'beta'],
  ]

  readonly queries = createQueriesController(
    this,
    {
      queries: this.queryKeys.map((queryKey) => ({
        queryKey,
        queryFn: () => sleep(10).then(() => queryKey[1]),
        retry: false,
      })),
      combine: (results) =>
        results.map((result) => ({
          status: result.status,
          data: result.data,
        })),
    },
    explicitQueriesClient,
  )
}

const contextQueriesTagName = 'test-context-queries-host'
if (!customElements.get(contextQueriesTagName)) {
  customElements.define(contextQueriesTagName, ContextQueriesHostElement)
}

class RawContextQueriesHostElement extends TestElementHost {
  readonly queryKeys = [
    [...rawContextQueriesKey, 'alpha'],
    [...rawContextQueriesKey, 'beta'],
  ]

  readonly queries = createQueriesController(this, {
    queries: this.queryKeys.map((queryKey) => ({
      queryKey,
      queryFn: async () => queryKey[1],
      retry: false,
    })),
  })
}

const rawContextQueriesTagName = 'test-raw-context-queries-host'
if (!customElements.get(rawContextQueriesTagName)) {
  customElements.define(rawContextQueriesTagName, RawContextQueriesHostElement)
}

class DeferredFieldsQueriesHost implements ReactiveControllerHost {
  private readonly controllers = new Set<ReactiveController>()

  updatesRequested = 0
  readonly updateComplete: Promise<boolean> = Promise.resolve(true)

  readonly queries = createQueriesController(this, () => ({
    queries: this.ids.map((id) => ({
      queryKey: [...deferredFieldsQueriesKey, id],
      queryFn: async () => id,
      retry: false,
    })),
    combine: (results) => results.map((result) => result.status),
  }))

  readonly firstRead = this.queries()
  readonly ids = ['alpha', 'beta'] as const

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

describe('createQueriesController', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should resolve from the pre-connect placeholder state on the first provider connection', async () => {
    const consumer = document.createElement(
      contextQueriesTagName,
    ) as ContextQueriesHostElement

    expect(consumer.queries()).toEqual([
      { status: 'pending', data: undefined },
      { status: 'pending', data: undefined },
    ])

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
    expect(consumer.queries()[0]?.status).toBe('success')
    expect(consumer.queries()[1]?.status).toBe('success')
    expect(consumer.queries().map((item) => item.data)).toEqual([
      'alpha',
      'beta',
    ])

    consumer.queries.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should prefer an explicit client over the provider context', async () => {
    const explicitClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const providerClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    explicitQueriesClient = explicitClient

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = providerClient

    const consumer = document.createElement(
      contextQueriesTagName,
    ) as ContextQueriesHostElement
    provider.append(consumer)

    document.body.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.queries()[0]?.status).toBe('success')
    expect(consumer.queries()[1]?.status).toBe('success')
    expect(
      explicitClient.getQueryCache().find({ queryKey: consumer.queryKeys[0]! })
        ?.state.data,
    ).toBe('alpha')
    expect(
      providerClient.getQueryCache().find({ queryKey: consumer.queryKeys[0]! }),
    ).toBeUndefined()

    consumer.queries.destroy()
    provider.remove()
    explicitQueriesClient = undefined
    await Promise.resolve()
  })

  it('should combine multiple query results', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key1 = queryKey()
    const key2 = queryKey()
    const host = new TestControllerHost()

    const queries = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 'alpha'),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(10).then(() => 'beta'),
          },
        ] as const,
        combine: (results) => results.map((result) => result.data),
      },
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(queries()).toEqual(['alpha', 'beta'])
  })

  it('should not request another update when stable function query options refresh during host update', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    const host = new TestControllerHost()
    let callCount = 0

    const queries = createQueriesController(
      host,
      () => ({
        queries: [
          {
            queryKey: key,
            queryFn: async () => {
              await sleep(10)
              callCount += 1
              return 'stable-result'
            },
            staleTime: Infinity,
          },
        ] as const,
      }),
      client,
    )

    try {
      host.connect()
      host.update()

      await vi.advanceTimersByTimeAsync(10)
      expect(queries()[0]?.isSuccess).toBe(true)

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        host.update()
        await Promise.resolve()
      }

      expect(host.updatesRequested).toBe(0)
      expect(queries()[0]?.data).toBe('stable-result')
      expect(callCount).toBe(1)
    } finally {
      queries.destroy()
    }
  })

  it('should not request an update for refetch-only state changes when data was read and result refetch is invoked', async () => {
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

    const queries = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: key,
            initialData: 'stable-data',
            staleTime: Infinity,
            queryFn: () =>
              new Promise<string>((resolve) => {
                resolveRefetch = () => resolve('stable-data')
              }),
          },
        ] as const,
      },
      client,
    )

    try {
      host.connect()
      host.update()

      expect(queries()[0]?.data).toBe('stable-data')
      await Promise.resolve()
      await Promise.resolve()

      host.updatesRequested = 0

      const refetch = queries()[0]!.refetch()

      expect(resolveRefetch).toBeDefined()
      await Promise.resolve()
      expect(host.updatesRequested).toBe(0)

      resolveRefetch!()
      await refetch
      await Promise.resolve()
      expect(host.updatesRequested).toBe(0)
    } finally {
      queries.destroy()
    }
  })

  it('should not re-default query options when subscribed queries emit', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const originalDefaultQueryOptions = client.defaultQueryOptions
    let defaultQueryOptionsCalls = 0
    client.defaultQueryOptions = ((options) => {
      defaultQueryOptionsCalls += 1
      return originalDefaultQueryOptions.call(client, options as never)
    }) as typeof client.defaultQueryOptions

    const key = queryKey()
    const host = new TestControllerHost()
    let resolveRefetch: (() => void) | undefined

    const queries = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: key,
            initialData: 'stable-data',
            staleTime: Infinity,
            queryFn: () =>
              new Promise<string>((resolve) => {
                resolveRefetch = () => resolve('stable-data')
              }),
          },
        ] as const,
      },
      client,
    )

    try {
      host.connect()
      host.update()

      expect(queries()[0]?.isFetching).toBe(false)
      await Promise.resolve()
      await Promise.resolve()

      defaultQueryOptionsCalls = 0

      const refetch = queries()[0]!.refetch()

      expect(resolveRefetch).toBeDefined()
      await Promise.resolve()
      expect(queries()[0]?.isFetching).toBe(true)
      expect(defaultQueryOptionsCalls).toBe(0)

      resolveRefetch!()
      await refetch
      await Promise.resolve()
      expect(queries()[0]?.isFetching).toBe(false)
      expect(defaultQueryOptionsCalls).toBe(0)
    } finally {
      queries.destroy()
    }
  })

  it('should refresh suppressed query results on the next accessor read when a newly read property changed', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    const host = new TestControllerHost()

    const queries = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: key,
            initialData: 'initial-data',
            staleTime: Infinity,
            queryFn: async () => 'unused',
          },
        ] as const,
      },
      client,
    )

    try {
      host.connect()
      host.update()

      expect(queries()[0]?.status).toBe('success')
      await Promise.resolve()
      await Promise.resolve()

      host.updatesRequested = 0

      client.setQueryData(key, 'updated-data')

      await Promise.resolve()
      expect(host.updatesRequested).toBe(0)

      expect(queries()[0]?.data).toBe('updated-data')
      expect(host.updatesRequested).toBe(0)
    } finally {
      queries.destroy()
    }
  })

  it('should support dynamic add/remove and keep partial failure stability', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    const host = new TestControllerHost()
    let includeThird = false
    let includeFailing = true

    const queries = createQueriesController(
      host,
      () => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 'alpha'),
          },
          ...(includeFailing
            ? [
                {
                  queryKey: key2,
                  queryFn: () =>
                    sleep(10).then(() => Promise.reject(new Error('m13-fail'))),
                },
              ]
            : []),
          ...(includeThird
            ? [
                {
                  queryKey: key3,
                  queryFn: () => sleep(10).then(() => 'gamma'),
                },
              ]
            : []),
        ] as const,
        combine: (results) =>
          results.map((result) => ({
            status: result.status,
            data: result.data,
            error: result.error instanceof Error ? result.error.message : null,
          })),
      }),
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(queries()).toHaveLength(2)
    expect(queries()[0]).toMatchObject({ status: 'success', data: 'alpha' })
    expect(queries()[1]).toMatchObject({ status: 'error', error: 'm13-fail' })

    includeThird = true
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(queries()).toHaveLength(3)
    expect(queries()[0]?.status).toBe('success')
    expect(queries()[1]?.status).toBe('error')
    expect(queries()[2]).toMatchObject({ status: 'success', data: 'gamma' })

    includeFailing = false
    host.update()

    expect(queries()).toHaveLength(2)
    expect(queries()[0]?.status).toBe('success')
    expect(queries()[1]?.status).toBe('success')
    expect(queries().map((item) => item.data)).toEqual(['alpha', 'gamma'])
  })

  it('should preserve the documented result order mapping when queries are reordered', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    const host = new TestControllerHost()
    let order: Array<'first' | 'second'> = ['first', 'second']

    const queries = createQueriesController(
      host,
      () => ({
        queries: order.map((id) => ({
          queryKey: [...key, id],
          queryFn: () => sleep(10).then(() => id),
        })),
        combine: (results) => results.map((result) => result.data),
      }),
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(queries()).toEqual(['first', 'second'])

    order = ['second', 'first']
    host.update()

    expect(queries()).toEqual(['second', 'first'])
  })

  it('should return stable per-index results for duplicate query keys', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const key = queryKey()
    const host = new TestControllerHost()
    let callCount = 0

    const queries = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: key,
            queryFn: async () => {
              await sleep(10)
              callCount += 1
              return 'shared-value'
            },
          },
          {
            queryKey: key,
            queryFn: async () => {
              await sleep(10)
              callCount += 1
              return 'shared-value'
            },
          },
        ] as const,
        combine: (results) =>
          results.map((result) => ({
            status: result.status,
            data: result.data,
          })),
      },
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(10)
    expect(queries()).toHaveLength(2)
    expect(queries()[0]?.status).toBe('success')
    expect(queries()[1]?.status).toBe('success')
    expect(queries()[0]?.data).toBe('shared-value')
    expect(queries()[1]?.data).toBe('shared-value')
    expect(callCount).toBeGreaterThan(0)
  })

  it('should fail after the handshake when the provider is missing and recover when a provider is adopted later', async () => {
    const consumer = document.createElement(
      contextQueriesTagName,
    ) as ContextQueriesHostElement

    expect(consumer.queries()).toEqual([
      { status: 'pending', data: undefined },
      { status: 'pending', data: undefined },
    ])

    document.body.append(consumer)

    expect(() => consumer.queries()).not.toThrow()
    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.queries()).toThrow(/No QueryClient available/)

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
    expect(consumer.queries()[0]?.status).toBe('success')
    expect(consumer.queries()[1]?.status).toBe('success')
    expect(consumer.queries().map((item) => item.data)).toEqual([
      'alpha',
      'beta',
    ])

    consumer.queries.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should reject placeholder refetch of raw query results after the missing-client handshake', async () => {
    const consumer = document.createElement(
      rawContextQueriesTagName,
    ) as RawContextQueriesHostElement

    const firstQuery = consumer.queries()[0]
    expect(firstQuery?.status).toBe('pending')

    document.body.append(consumer)

    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.queries()).toThrow(/No QueryClient available/)
    await expect(firstQuery?.refetch()).rejects.toThrow(
      'No QueryClient available. Pass one explicitly or render within QueryClientProvider.',
    )

    consumer.queries.destroy()
    consumer.remove()
    await Promise.resolve()
  })

  it('should defer placeholder accessors in the constructor until host fields are initialized', () => {
    expect(() => new DeferredFieldsQueriesHost()).not.toThrow()

    const host = new DeferredFieldsQueriesHost()
    expect(host.queries()).toEqual(['pending', 'pending'])
  })

  it('should materialize defined initialData in placeholder combine before a client is available', () => {
    const key = queryKey()
    const host = new TestControllerHost()
    const queries = createQueriesController(host, {
      queries: [
        queryOptions({
          queryKey: key,
          queryFn: async () => ({ id: 4, name: 'Marie' }),
          initialData: { id: 0, name: 'Seed' },
        }),
      ] as const,
      combine: (result) => result[0].data.name,
    })

    expect(queries()).toBe('Seed')

    queries.destroy()
  })

  it('should defer dynamic accessors in the explicit-client constructor until host fields are initialized', () => {
    const key = queryKey()
    const client = new QueryClient()

    class DeferredExplicitQueriesHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()

      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

      readonly queries = createQueriesController(
        this,
        () => ({
          queries: this.ids.map((id) => ({
            queryKey: [...key, id],
            queryFn: async () => id,
            retry: false,
          })),
          combine: (results) => results.map((result) => result.status),
        }),
        client,
      )

      readonly firstRead = this.queries()
      readonly ids = ['alpha', 'beta'] as const

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

    expect(() => new DeferredExplicitQueriesHost()).not.toThrow()

    const host = new DeferredExplicitQueriesHost()
    expect(host.queries()).toEqual(['pending', 'pending'])

    host.queries.destroy()
  })

  it('should defer static combine callbacks in the explicit-client constructor until host fields are initialized', () => {
    const key = queryKey()
    const client = new QueryClient()

    class DeferredExplicitCombineQueriesHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()

      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

      readonly queries = createQueriesController(
        this,
        {
          queries: [
            {
              queryKey: key,
              queryFn: async () => 'alpha',
              retry: false,
            },
          ] as const,
          combine: (results) =>
            this.ids.map((id, index) => `${id}:${results[index]?.status}`),
        },
        client,
      )

      readonly firstRead = this.queries()
      readonly ids = ['alpha'] as const

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

    expect(() => new DeferredExplicitCombineQueriesHost()).not.toThrow()

    const host = new DeferredExplicitCombineQueriesHost()
    expect(host.queries()).toEqual(['alpha:pending'])

    host.queries.destroy()
  })

  it('should re-surface permanent static combine errors in the explicit-client constructor after initialization', async () => {
    const key = queryKey()
    const client = new QueryClient()

    class InvalidExplicitCombineQueriesHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()

      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

      readonly queries = createQueriesController(
        this,
        {
          queries: [
            {
              queryKey: key,
              queryFn: async () => 'alpha',
              retry: false,
            },
          ] as const,
          combine: () => {
            throw new Error('invalid combine')
          },
        },
        client,
      )

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

    expect(() => new InvalidExplicitCombineQueriesHost()).not.toThrow()

    const host = new InvalidExplicitCombineQueriesHost()
    await Promise.resolve()
    expect(() => host.queries()).toThrow('invalid combine')
  })

  it('should not throw for a queries controller on an already-connected host with an explicit client', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const key1 = queryKey()
    const key2 = queryKey()
    client.setQueryData(key1, 'alpha')
    client.setQueryData(key2, 'beta')

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
    const queries = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: key1,
            queryFn: async () => 'fetched-alpha',
            staleTime: 30_000,
          },
          {
            queryKey: key2,
            queryFn: async () => 'fetched-beta',
            staleTime: 30_000,
          },
        ] as const,
        combine: (results) =>
          results.map((result) => ({
            status: result.status,
            data: result.data,
          })),
      },
      client,
    )

    await Promise.resolve()
    await Promise.resolve()
    expect(queries()).toEqual([
      { status: 'success', data: 'alpha' },
      { status: 'success', data: 'beta' },
    ])

    queries.destroy()
  })
})
