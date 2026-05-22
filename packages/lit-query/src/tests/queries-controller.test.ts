import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createQueriesController } from '../createQueriesController.js'
import { queryOptions } from '../queryOptions.js'
import {
  TestControllerHost,
  TestElementHost,
  waitFor,
  waitForMissingQueryClient,
} from './testHost.js'

const providerTagName = 'test-query-client-provider-queries'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

let explicitQueriesClient: QueryClient | undefined

class ContextQueriesHostElement extends TestElementHost {
  readonly queryKeys = [
    ['context-queries', 'alpha'] as const,
    ['context-queries', 'beta'] as const,
  ]

  readonly queries = createQueriesController(
    this,
    {
      queries: this.queryKeys.map((queryKey) => ({
        queryKey,
        queryFn: async () => queryKey[1],
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
    ['raw-context-queries', 'alpha'] as const,
    ['raw-context-queries', 'beta'] as const,
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
      queryKey: ['deferred-fields-queries', id] as const,
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
  it('LC-QUERIES-01: first provider connection resolves from the pre-connect placeholder state', async () => {
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

    await waitFor(
      () =>
        consumer.queries()[0]?.status === 'success' &&
        consumer.queries()[1]?.status === 'success',
    )
    expect(consumer.queries().map((item) => item.data)).toEqual([
      'alpha',
      'beta',
    ])

    consumer.queries.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('LC-QUERIES-02: explicit client takes precedence over provider context', async () => {
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

    await waitFor(
      () =>
        consumer.queries()[0]?.status === 'success' &&
        consumer.queries()[1]?.status === 'success',
    )

    expect(
      explicitClient.getQueryCache().find({ queryKey: consumer.queryKeys[0]! }),
    ).toBeDefined()
    expect(
      providerClient.getQueryCache().find({ queryKey: consumer.queryKeys[0]! }),
    ).toBeUndefined()

    consumer.queries.destroy()
    provider.remove()
    explicitQueriesClient = undefined
    await Promise.resolve()
  })

  it('combines multiple query results', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()

    const queries = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: ['q1'],
            queryFn: async () => 'alpha',
          },
          {
            queryKey: ['q2'],
            queryFn: async () => 'beta',
          },
        ] as const,
        combine: (results) => results.map((result) => result.data),
      },
      client,
    )

    host.connect()
    host.update()

    await waitFor(() => queries().every((value) => typeof value === 'string'))
    expect(queries()).toEqual(['alpha', 'beta'])
  })

  it('M13: supports dynamic add/remove and keeps partial failure stability', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let includeThird = false
    let includeFailing = true

    const queries = createQueriesController(
      host,
      () => ({
        queries: [
          {
            queryKey: ['m13', 'alpha'] as const,
            queryFn: async () => 'alpha',
          },
          ...(includeFailing
            ? [
                {
                  queryKey: ['m13', 'failing'] as const,
                  queryFn: async () => {
                    throw new Error('m13-fail')
                  },
                },
              ]
            : []),
          ...(includeThird
            ? [
                {
                  queryKey: ['m13', 'gamma'] as const,
                  queryFn: async () => 'gamma',
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

    await waitFor(() => queries().length === 2)
    await waitFor(
      () =>
        queries()[0]?.status === 'success' && queries()[1]?.status === 'error',
    )
    expect(queries()[0]).toMatchObject({ status: 'success', data: 'alpha' })
    expect(queries()[1]).toMatchObject({ status: 'error', error: 'm13-fail' })

    includeThird = true
    host.update()
    await waitFor(() => queries().length === 3)
    await waitFor(
      () =>
        queries()[0]?.status === 'success' &&
        queries()[1]?.status === 'error' &&
        queries()[2]?.status === 'success',
    )
    expect(queries()[2]).toMatchObject({ status: 'success', data: 'gamma' })

    includeFailing = false
    host.update()
    await waitFor(() => queries().length === 2)
    await waitFor(
      () =>
        queries()[0]?.status === 'success' &&
        queries()[1]?.status === 'success',
    )
    expect(queries().map((item) => item.data)).toEqual(['alpha', 'gamma'])
  })

  it('CQS-ADV-01: reordering queries preserves documented result order mapping', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let order: Array<'first' | 'second'> = ['first', 'second']

    const queries = createQueriesController(
      host,
      () => ({
        queries: order.map((id) => ({
          queryKey: ['cqs-adv-01', id] as const,
          queryFn: async () => id,
        })),
        combine: (results) => results.map((result) => result.data),
      }),
      client,
    )

    host.connect()
    host.update()

    await waitFor(() => queries().every((value) => typeof value === 'string'))
    expect(queries()).toEqual(['first', 'second'])

    order = ['second', 'first']
    host.update()
    await waitFor(() => queries()[0] === 'second' && queries()[1] === 'first')
    expect(queries()).toEqual(['second', 'first'])
  })

  it('CQS-ADV-02: duplicate query keys return stable per-index results by contract', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let callCount = 0

    const queries = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: ['dup-key'] as const,
            queryFn: async () => {
              callCount += 1
              return 'shared-value'
            },
          },
          {
            queryKey: ['dup-key'] as const,
            queryFn: async () => {
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

    await waitFor(
      () =>
        queries().length === 2 &&
        queries()[0]?.status === 'success' &&
        queries()[1]?.status === 'success',
    )
    expect(queries()[0]?.data).toBe('shared-value')
    expect(queries()[1]?.data).toBe('shared-value')
    expect(callCount).toBeGreaterThan(0)
  })

  it('LC-QUERIES-03: missing provider fails after handshake and later provider adoption recovers', async () => {
    const consumer = document.createElement(
      contextQueriesTagName,
    ) as ContextQueriesHostElement

    expect(consumer.queries()).toEqual([
      { status: 'pending', data: undefined },
      { status: 'pending', data: undefined },
    ])

    document.body.append(consumer)

    expect(() => consumer.queries()).not.toThrow()
    await waitForMissingQueryClient(() => consumer.queries())

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

    await waitFor(
      () =>
        consumer.queries()[0]?.status === 'success' &&
        consumer.queries()[1]?.status === 'success',
    )
    expect(consumer.queries().map((item) => item.data)).toEqual([
      'alpha',
      'beta',
    ])

    consumer.queries.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('LC-QUERIES-04: raw query results reject placeholder refetch after missing-client handshake', async () => {
    const consumer = document.createElement(
      rawContextQueriesTagName,
    ) as RawContextQueriesHostElement

    const firstQuery = consumer.queries()[0]
    expect(firstQuery?.status).toBe('pending')

    document.body.append(consumer)

    await waitForMissingQueryClient(() => consumer.queries())
    await expect(firstQuery?.refetch()).rejects.toThrow(
      'No QueryClient available. Pass one explicitly or render within QueryClientProvider.',
    )

    consumer.queries.destroy()
    consumer.remove()
    await Promise.resolve()
  })

  it('LC-QUERIES-05: constructor defers placeholder accessors until host fields are initialized', () => {
    expect(() => new DeferredFieldsQueriesHost()).not.toThrow()

    const host = new DeferredFieldsQueriesHost()
    expect(host.queries()).toEqual(['pending', 'pending'])
  })

  it('LC-QUERIES-06: placeholder combine materializes defined initialData before a client is available', () => {
    const host = new TestControllerHost()
    const queries = createQueriesController(host, {
      queries: [
        queryOptions({
          queryKey: ['placeholder-initial-data'] as const,
          queryFn: async () => ({ id: 4, name: 'Marie' }),
          initialData: { id: 0, name: 'Seed' },
        }),
      ] as const,
      combine: (result) => result[0].data.name,
    })

    expect(queries()).toBe('Seed')

    queries.destroy()
  })

  it('LC-QUERIES-07: explicit-client constructor defers dynamic accessors until host fields are initialized', () => {
    const client = new QueryClient()

    class DeferredExplicitQueriesHost implements ReactiveControllerHost {
      private readonly controllers = new Set<ReactiveController>()

      updatesRequested = 0
      readonly updateComplete: Promise<boolean> = Promise.resolve(true)

      readonly queries = createQueriesController(
        this,
        () => ({
          queries: this.ids.map((id) => ({
            queryKey: ['deferred-explicit-queries', id] as const,
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

  it('LC-QUERIES-08: explicit-client constructor defers static combine callbacks until host fields are initialized', () => {
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
              queryKey: ['deferred-explicit-combine-queries', 'alpha'] as const,
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

  it('LC-QUERIES-09: explicit-client constructor re-surfaces permanent static combine errors after initialization', async () => {
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
              queryKey: ['invalid-explicit-combine-queries', 'alpha'] as const,
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

  it('ALREADYCONN-QUERIES-01: queries controller on already-connected host with explicit client does not throw', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    client.setQueryData(['already-connected-queries', 'alpha'], 'alpha')
    client.setQueryData(['already-connected-queries', 'beta'], 'beta')

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
            queryKey: ['already-connected-queries', 'alpha'] as const,
            queryFn: async () => 'fetched-alpha',
            staleTime: 30_000,
          },
          {
            queryKey: ['already-connected-queries', 'beta'] as const,
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
