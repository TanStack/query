import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createQueriesController } from '../createQueriesController.js'
import { queryOptions } from '../queryOptions.js'
import { generateElementName } from './utils.js'
import type { QueriesResultAccessor } from '../createQueriesController.js'
import type { QueryObserverResult, QueryStatus } from '@tanstack/query-core'

const providerTagName = generateElementName()
customElements.define(providerTagName, QueryClientProvider)

describe('createQueriesController', () => {
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
      readonly queryKeys = [
        [...key, 'alpha'],
        [...key, 'beta'],
      ]

      readonly queries = createQueriesController(this, {
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
      })

      override render() {
        const results = this.queries()
          .map((result) => `${result.status}:${result.data ?? 'none'}`)
          .join(', ')
        return html`results: ${results}`
      }
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.queries()).toEqual([
      { status: 'pending', data: undefined },
      { status: 'pending', data: undefined },
    ])

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.queries()[0]?.status).toBe('success')
    expect(consumer.queries()[1]?.status).toBe('success')
    expect(consumer.queries().map((item) => item.data)).toEqual([
      'alpha',
      'beta',
    ])
    expect(consumer.shadowRoot).toHaveTextContent(
      'results: success:alpha, success:beta',
    )

    consumer.queries.destroy()
    provider.remove()
  })

  it('should prefer an explicit client over the provider context', async () => {
    const key = queryKey()
    const providerClient = new QueryClient()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = providerClient

    class Consumer extends LitElement {
      readonly queryKeys = [
        [...key, 'alpha'],
        [...key, 'beta'],
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
        queryClient,
      )

      override render() {
        const results = this.queries()
          .map((result) => `${result.status}:${result.data ?? 'none'}`)
          .join(', ')
        return html`results: ${results}`
      }
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.queries()[0]?.status).toBe('success')
    expect(consumer.queries()[1]?.status).toBe('success')
    expect(consumer.shadowRoot).toHaveTextContent(
      'results: success:alpha, success:beta',
    )
    expect(
      queryClient.getQueryCache().find({ queryKey: consumer.queryKeys[0]! })
        ?.state.data,
    ).toBe('alpha')
    expect(
      providerClient.getQueryCache().find({ queryKey: consumer.queryKeys[0]! }),
    ).toBeUndefined()

    consumer.queries.destroy()
    provider.remove()
  })

  it('should combine multiple query results', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    class Host extends LitElement {
      readonly queries = createQueriesController(
        this,
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
          ],
          combine: (results) => results.map((result) => result.data),
        },
        queryClient,
      )

      override render() {
        const data = this.queries().map((result) => result ?? 'none')
        return html`data: ${data.join(', ')}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    const queries = host.queries
    await host.updateComplete
    expect(host.shadowRoot).toHaveTextContent('data: none, none')
    await vi.advanceTimersByTimeAsync(10)
    expect(queries()).toEqual(['alpha', 'beta'])
    expect(host.shadowRoot).toHaveTextContent('data: alpha, beta')
  })

  it('should not have stale closures with combine (#6648)', async () => {
    const key = queryKey()

    class Host extends LitElement {
      static override properties = { count: { type: Number } }

      declare count: number

      readonly queries = createQueriesController(
        this,
        () => {
          const { count } = this
          return {
            queries: [
              {
                queryKey: key,
                queryFn: () => sleep(10).then(() => 'result'),
              },
            ],
            combine: (results) => ({
              count,
              res: results.map((result) => result.data).join(','),
            }),
          }
        },
        queryClient,
      )

      override render() {
        const { count, res } = this.queries()
        return html`data: ${String(count)} ${res}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    host.count = 0
    container.append(host)
    await vi.advanceTimersByTimeAsync(10)
    expect(host.shadowRoot).toHaveTextContent('data: 0 result')

    host.count = 1
    await host.updateComplete
    expect(host.shadowRoot).toHaveTextContent('data: 1 result')
  })

  it('should not request another update when stable function query options refresh during host update', async () => {
    const key = queryKey()
    let callCount = 0

    class Host extends LitElement {
      static override properties = { count: { type: Number } }

      declare count: number

      updatesRequested = 0

      readonly queries = createQueriesController(
        this,
        () => ({
          queries: [
            {
              queryKey: key,
              queryFn: () =>
                sleep(10).then(() => {
                  callCount += 1
                  return 'stable-result'
                }),
              staleTime: Infinity,
            },
          ],
        }),
        queryClient,
      )

      override requestUpdate(
        ...args: Parameters<LitElement['requestUpdate']>
      ): void {
        this.updatesRequested += 1
        super.requestUpdate(...args)
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const queries = host.queries

    try {
      container.append(host)
      await vi.advanceTimersByTimeAsync(10)
      expect(queries()[0].isSuccess).toBe(true)

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        host.count = i
        await host.updateComplete
      }
      expect(host.updatesRequested).toBe(5)
      expect(queries()[0].data).toBe('stable-result')
      expect(callCount).toBe(1)
    } finally {
      queries.destroy()
    }
  })

  it('should not request an update for refetch-only state changes when data was read and result refetch is invoked', async () => {
    const key = queryKey()
    let resolveRefetch: (() => void) | undefined

    class Host extends LitElement {
      updatesRequested = 0

      readonly queries = createQueriesController(
        this,
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
          ],
        },
        queryClient,
      )

      override requestUpdate(
        ...args: Parameters<LitElement['requestUpdate']>
      ): void {
        this.updatesRequested += 1
        super.requestUpdate(...args)
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const queries = host.queries

    try {
      container.append(host)
      await host.updateComplete
      expect(queries()[0].data).toBe('stable-data')
      await vi.advanceTimersByTimeAsync(0)

      host.updatesRequested = 0

      const refetch = queries()[0].refetch()

      expect(resolveRefetch).toBeDefined()
      await vi.advanceTimersByTimeAsync(0)
      expect(host.updatesRequested).toBe(0)

      resolveRefetch!()
      await refetch
      await vi.advanceTimersByTimeAsync(0)
      expect(host.updatesRequested).toBe(0)
    } finally {
      queries.destroy()
    }
  })

  it('should not re-default query options when subscribed queries emit', async () => {
    const originalDefaultQueryOptions = queryClient.defaultQueryOptions
    let defaultQueryOptionsCalls = 0
    queryClient.defaultQueryOptions = ((options) => {
      defaultQueryOptionsCalls += 1
      return originalDefaultQueryOptions.call(queryClient, options as never)
    }) as typeof queryClient.defaultQueryOptions

    const key = queryKey()
    let resolveRefetch: (() => void) | undefined

    class Host extends LitElement {
      readonly queries = createQueriesController(
        this,
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
          ],
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const queries = host.queries

    try {
      container.append(host)
      await host.updateComplete
      expect(queries()[0].isFetching).toBe(false)
      await vi.advanceTimersByTimeAsync(0)

      defaultQueryOptionsCalls = 0

      const refetch = queries()[0].refetch()

      expect(resolveRefetch).toBeDefined()
      await vi.advanceTimersByTimeAsync(0)
      expect(queries()[0].isFetching).toBe(true)
      expect(defaultQueryOptionsCalls).toBe(0)

      resolveRefetch!()
      await refetch
      await vi.advanceTimersByTimeAsync(0)
      expect(queries()[0].isFetching).toBe(false)
      expect(defaultQueryOptionsCalls).toBe(0)
    } finally {
      queries.destroy()
    }
  })

  it('should refresh suppressed query results on the next accessor read when a newly read property changed', async () => {
    const key = queryKey()

    class Host extends LitElement {
      updatesRequested = 0

      readonly queries = createQueriesController(
        this,
        {
          queries: [
            {
              queryKey: key,
              initialData: 'initial-data',
              staleTime: Infinity,
              queryFn: () => sleep(10).then(() => 'unused'),
            },
          ],
        },
        queryClient,
      )

      override requestUpdate(
        ...args: Parameters<LitElement['requestUpdate']>
      ): void {
        this.updatesRequested += 1
        super.requestUpdate(...args)
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const queries = host.queries

    try {
      container.append(host)
      await host.updateComplete
      expect(queries()[0].status).toBe('success')
      await vi.advanceTimersByTimeAsync(0)

      host.updatesRequested = 0

      queryClient.setQueryData(key, 'updated-data')
      await vi.advanceTimersByTimeAsync(0)
      expect(host.updatesRequested).toBe(0)

      expect(queries()[0].data).toBe('updated-data')
      expect(host.updatesRequested).toBe(0)
    } finally {
      queries.destroy()
    }
  })

  it('should return the same result between reads when nothing changed', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly queries = createQueriesController(
        this,
        {
          queries: [
            {
              queryKey: key,
              queryFn: () => sleep(10).then(() => 'data'),
            },
          ],
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    const queries = host.queries
    await vi.advanceTimersByTimeAsync(10)
    const result = queries()
    expect(queries()).toBe(result)
  })

  it('should support dynamic add/remove and keep partial failure stability', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    let includeThird = false
    let includeFailing = true

    class Host extends LitElement {
      readonly queries = createQueriesController(
        this,
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
                      sleep(10).then(() =>
                        Promise.reject(new Error('m13-fail')),
                      ),
                    retry: false,
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
          ],
          combine: (results) =>
            results.map((result) => ({
              status: result.status,
              data: result.data,
              error:
                result.error instanceof Error ? result.error.message : null,
            })),
        }),
        queryClient,
      )

      override render() {
        const results = this.queries()
          .map(
            (result) =>
              `${result.status}:${result.data ?? result.error ?? 'none'}`,
          )
          .join(', ')
        return html`results: ${results}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    const queries = host.queries
    await vi.advanceTimersByTimeAsync(10)
    expect(queries()).toHaveLength(2)
    expect(queries()[0]).toMatchObject({ status: 'success', data: 'alpha' })
    expect(queries()[1]).toMatchObject({ status: 'error', error: 'm13-fail' })
    expect(host.shadowRoot).toHaveTextContent(
      'results: success:alpha, error:m13-fail',
    )

    includeThird = true
    host.requestUpdate()
    await vi.advanceTimersByTimeAsync(10)
    expect(queries()).toHaveLength(3)
    expect(queries()[0]?.status).toBe('success')
    expect(queries()[1]?.status).toBe('error')
    expect(queries()[2]).toMatchObject({ status: 'success', data: 'gamma' })
    expect(host.shadowRoot).toHaveTextContent(
      'results: success:alpha, error:m13-fail, success:gamma',
    )

    includeFailing = false
    host.requestUpdate()
    await host.updateComplete
    expect(queries()).toHaveLength(2)
    expect(queries()[0]?.status).toBe('success')
    expect(queries()[1]?.status).toBe('success')
    expect(queries().map((item) => item.data)).toEqual(['alpha', 'gamma'])
    expect(host.shadowRoot).toHaveTextContent(
      'results: success:alpha, success:gamma',
    )
  })

  it('should preserve the documented result order mapping when queries are reordered', async () => {
    const key = queryKey()
    let order: Array<'first' | 'second'> = ['first', 'second']

    class Host extends LitElement {
      readonly queries = createQueriesController(
        this,
        () => ({
          queries: order.map((id) => ({
            queryKey: [...key, id],
            queryFn: () => sleep(10).then(() => id),
          })),
          combine: (results) => results.map((result) => result.data),
        }),
        queryClient,
      )

      override render() {
        const data = this.queries().map((result) => result ?? 'none')
        return html`data: ${data.join(', ')}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    const queries = host.queries
    await vi.advanceTimersByTimeAsync(10)
    expect(queries()).toEqual(['first', 'second'])
    expect(host.shadowRoot).toHaveTextContent('data: first, second')

    order = ['second', 'first']
    host.requestUpdate()
    await host.updateComplete
    expect(queries()).toEqual(['second', 'first'])
    expect(host.shadowRoot).toHaveTextContent('data: second, first')
  })

  it('should return stable per-index results for duplicate query keys', async () => {
    const key = queryKey()
    let callCount = 0

    class Host extends LitElement {
      readonly queries = createQueriesController(
        this,
        {
          queries: [
            {
              queryKey: key,
              queryFn: () =>
                sleep(10).then(() => {
                  callCount += 1
                  return 'shared-value'
                }),
            },
            {
              queryKey: key,
              queryFn: () =>
                sleep(10).then(() => {
                  callCount += 1
                  return 'shared-value'
                }),
            },
          ],
          combine: (results) =>
            results.map((result) => ({
              status: result.status,
              data: result.data,
            })),
        },
        queryClient,
      )

      override render() {
        const results = this.queries()
          .map((result) => `${result.status}:${result.data ?? 'none'}`)
          .join(', ')
        return html`results: ${results}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    const queries = host.queries
    await vi.advanceTimersByTimeAsync(10)
    expect(queries()).toHaveLength(2)
    expect(queries()[0]?.status).toBe('success')
    expect(queries()[1]?.status).toBe('success')
    expect(queries()[0]?.data).toBe('shared-value')
    expect(queries()[1]?.data).toBe('shared-value')
    expect(host.shadowRoot).toHaveTextContent(
      'results: success:shared-value, success:shared-value',
    )
    expect(callCount).toBeGreaterThan(0)
  })

  it('should not process detached updates when disconnected while in-flight', async () => {
    const key = queryKey()

    class Host extends LitElement {
      updatesRequested = 0

      readonly queries = createQueriesController(
        this,
        {
          queries: [
            {
              queryKey: key,
              queryFn: () => sleep(10).then(() => 'data'),
            },
          ],
        },
        queryClient,
      )

      override requestUpdate(
        ...args: Parameters<LitElement['requestUpdate']>
      ): void {
        this.updatesRequested += 1
        super.requestUpdate(...args)
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    await host.updateComplete

    host.remove()
    await host.updateComplete
    const updatesAfterDisconnect = host.updatesRequested
    await vi.advanceTimersByTimeAsync(10)
    expect(host.updatesRequested).toBe(updatesAfterDisconnect)
  })

  it('should fail after the handshake when the provider is missing and recover when a provider is adopted later', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly queryKeys = [
        [...key, 'alpha'],
        [...key, 'beta'],
      ]

      readonly queries = createQueriesController(this, {
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
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.queries()).toEqual([
      { status: 'pending', data: undefined },
      { status: 'pending', data: undefined },
    ])

    container.append(consumer)
    expect(() => consumer.queries()).not.toThrow()
    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.queries()).toThrow(/No QueryClient available/)

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)

    container.append(provider)
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
  })

  it('should reject placeholder refetch of raw query results after the missing-client handshake', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly queryKeys = [
        [...key, 'alpha'],
        [...key, 'beta'],
      ]

      readonly queries = createQueriesController(this, {
        queries: this.queryKeys.map((queryKey) => ({
          queryKey,
          queryFn: () => sleep(10).then(() => queryKey[1]),
          retry: false,
        })),
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    const firstQuery = consumer.queries()[0]
    expect(firstQuery?.status).toBe('pending')

    container.append(consumer)
    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.queries()).toThrow(/No QueryClient available/)
    await expect(firstQuery?.refetch()).rejects.toThrow(
      'No QueryClient available. Pass one explicitly or render within QueryClientProvider.',
    )

    consumer.queries.destroy()
    consumer.remove()
  })

  it('should defer placeholder accessors in the constructor until host fields are initialized', () => {
    const key = queryKey()

    class DeferredFieldsQueriesHost extends LitElement {
      readonly queries = createQueriesController(this, () => ({
        queries: this.ids.map((id) => ({
          queryKey: [...key, id],
          queryFn: () => sleep(10).then(() => id),
          retry: false,
        })),
        combine: (results) => results.map((result) => result.status),
      }))

      readonly firstRead = this.queries()
      readonly ids = ['alpha', 'beta']
    }
    customElements.define(generateElementName(), DeferredFieldsQueriesHost)

    expect(() => new DeferredFieldsQueriesHost()).not.toThrow()

    const host = new DeferredFieldsQueriesHost()
    expect(host.queries()).toEqual(['pending', 'pending'])
  })

  it('should re-surface permanent placeholder combine errors after initialization', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly queries = createQueriesController(this, {
        queries: [
          {
            queryKey: key,
            queryFn: () => sleep(10).then(() => 'alpha'),
            retry: false,
          },
        ],
        combine: () => {
          throw new Error('invalid combine')
        },
      })

      readonly firstRead = this.queries()
    }
    customElements.define(generateElementName(), Host)

    expect(() => new Host()).not.toThrow()

    const host = new Host()
    await vi.advanceTimersByTimeAsync(0)
    expect(() => host.queries()).toThrow('invalid combine')
  })

  it('should materialize defined initialData in placeholder combine before a client is available', () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly queries = createQueriesController(this, {
        queries: [
          queryOptions({
            queryKey: key,
            queryFn: () => sleep(10).then(() => ({ id: 4, name: 'Marie' })),
            initialData: { id: 0, name: 'Seed' },
          }),
        ],
        combine: (result) => result[0].data.name,
      })
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const queries = host.queries

    expect(queries()).toBe('Seed')

    queries.destroy()
  })

  it('should call initialData and initialDataUpdatedAt functions in placeholder combine before a client is available', () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly queries = createQueriesController(this, {
        queries: [
          {
            queryKey: key,
            queryFn: () => sleep(10).then(() => 'fetched'),
            initialData: () => 'seed',
            initialDataUpdatedAt: () => 1000,
          },
        ],
        combine: (result) => ({
          data: result[0].data,
          dataUpdatedAt: result[0].dataUpdatedAt,
        }),
      })
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const queries = host.queries

    expect(queries()).toEqual({ data: 'seed', dataUpdatedAt: 1000 })

    queries.destroy()
  })

  it('should apply select to initialData in placeholder combine before a client is available', () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly queries = createQueriesController(this, {
        queries: [
          {
            queryKey: key,
            queryFn: () => sleep(10).then(() => 'fetched'),
            initialData: 'seed',
            select: (data: string) => data.toUpperCase(),
          },
        ],
        combine: (result) => result[0].data,
      })
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const queries = host.queries

    expect(queries()).toBe('SEED')

    queries.destroy()
  })

  it('should defer dynamic accessors in the explicit-client constructor until host fields are initialized', async () => {
    const key = queryKey()

    class DeferredExplicitQueriesHost extends LitElement {
      readonly queries = createQueriesController(
        this,
        () => ({
          queries: this.ids.map((id) => ({
            queryKey: [...key, id],
            queryFn: () => sleep(10).then(() => id),
            retry: false,
          })),
          combine: (results) => results.map((result) => result.status),
        }),
        queryClient,
      )

      readonly firstRead = this.queries()
      readonly ids = ['alpha', 'beta']
    }
    customElements.define(generateElementName(), DeferredExplicitQueriesHost)

    expect(() => new DeferredExplicitQueriesHost()).not.toThrow()

    const host = new DeferredExplicitQueriesHost()
    expect(host.queries()).toEqual(['pending', 'pending'])

    container.append(host)
    await vi.advanceTimersByTimeAsync(10)
    expect(host.queries()).toEqual(['success', 'success'])

    host.queries.destroy()
  })

  it('should defer static combine callbacks in the explicit-client constructor until host fields are initialized', async () => {
    const key = queryKey()

    class DeferredExplicitCombineQueriesHost extends LitElement {
      readonly queries = createQueriesController(
        this,
        {
          queries: [
            {
              queryKey: key,
              queryFn: () => sleep(10).then(() => 'alpha'),
              retry: false,
            },
          ],
          combine: (results) =>
            this.ids.map((id, index) => `${id}:${results[index]?.status}`),
        },
        queryClient,
      )

      readonly firstRead = this.queries()
      readonly ids = ['alpha']
    }
    customElements.define(
      generateElementName(),
      DeferredExplicitCombineQueriesHost,
    )

    expect(() => new DeferredExplicitCombineQueriesHost()).not.toThrow()

    const host = new DeferredExplicitCombineQueriesHost()
    expect(host.queries()).toEqual(['alpha:pending'])

    container.append(host)
    await vi.advanceTimersByTimeAsync(10)
    expect(host.queries()).toEqual(['alpha:success'])

    host.queries.destroy()
  })

  it('should re-surface permanent static combine errors in the explicit-client constructor after initialization', async () => {
    const key = queryKey()

    class InvalidExplicitCombineQueriesHost extends LitElement {
      readonly queries = createQueriesController(
        this,
        {
          queries: [
            {
              queryKey: key,
              queryFn: () => sleep(10).then(() => 'alpha'),
              retry: false,
            },
          ],
          combine: () => {
            throw new Error('invalid combine')
          },
        },
        queryClient,
      )
    }
    customElements.define(
      generateElementName(),
      InvalidExplicitCombineQueriesHost,
    )

    expect(() => new InvalidExplicitCombineQueriesHost()).not.toThrow()

    const host = new InvalidExplicitCombineQueriesHost()
    await vi.advanceTimersByTimeAsync(0)
    expect(() => host.queries()).toThrow('invalid combine')
  })

  it('should reuse hydrated data on an already-connected host without an eager refetch', async () => {
    const key = queryKey()
    let queryFnCalls = 0

    queryClient.setQueryData(key, 'hydrated-value')

    class Host extends LitElement {
      queries?: QueriesResultAccessor<Array<QueryObserverResult<string>>>

      override render() {
        return html`data: ${this.queries?.()[0]?.data ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    await host.updateComplete

    host.queries = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: key,
            queryFn: () => {
              queryFnCalls += 1
              return sleep(10).then(() => 'fetched-value')
            },
            staleTime: 30000,
          },
        ],
      },
      queryClient,
    )
    const queries = host.queries
    await vi.advanceTimersByTimeAsync(0)
    expect(queries()[0]?.data).toBe('hydrated-value')
    expect(queryFnCalls).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('data: hydrated-value')

    queries.destroy()
  })

  it('should not throw for a queries controller on an already-connected host with an explicit client', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    queryClient.setQueryData(key1, 'alpha')
    queryClient.setQueryData(key2, 'beta')

    class Host extends LitElement {
      queries?: QueriesResultAccessor<
        Array<{ status: QueryStatus; data: string | undefined }>
      >
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    await host.updateComplete

    host.queries = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 'fetched-alpha'),
            staleTime: 30000,
          },
          {
            queryKey: key2,
            queryFn: () => sleep(10).then(() => 'fetched-beta'),
            staleTime: 30000,
          },
        ],
        combine: (results) =>
          results.map((result) => ({
            status: result.status,
            data: result.data,
          })),
      },
      queryClient,
    )
    const queries = host.queries
    expect(queries()).toEqual([
      { status: 'success', data: 'alpha' },
      { status: 'success', data: 'beta' },
    ])
    await vi.advanceTimersByTimeAsync(10)
    expect(queries()).toEqual([
      { status: 'success', data: 'alpha' },
      { status: 'success', data: 'beta' },
    ])

    queries.destroy()
  })

  it('should switch queries controller to new provider client while connected', async () => {
    const key = queryKey()
    const clientA = new QueryClient()
    const clientB = new QueryClient()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = clientA
    container.append(provider)
    await provider.updateComplete

    class Consumer extends LitElement {
      queryCalls = 0
      readonly queryKey = key

      readonly queries = createQueriesController(this, () => ({
        queries: [
          {
            queryKey: this.queryKey,
            queryFn: () => {
              this.queryCalls += 1
              return sleep(10).then(() => `q-${this.queryCalls}`)
            },
            retry: false,
          },
        ],
        combine: (results) => results.map((result) => result.data),
      }))

      override render() {
        return html`data: ${this.queries()[0] ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    provider.append(consumer)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.queries()[0]).toBe('q-1')
    expect(consumer.shadowRoot).toHaveTextContent('data: q-1')

    const cacheAEntryBeforeSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(cacheAEntryBeforeSwitch?.getObserversCount()).toBe(1)

    provider.client = clientB
    await provider.updateComplete
    await vi.advanceTimersByTimeAsync(10)
    expect(
      clientB
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount(),
    ).toBe(1)
    expect(consumer.shadowRoot).toHaveTextContent('data: q-2')

    const cacheAEntryAfterSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(cacheAEntryAfterSwitch?.getObserversCount() ?? 0).toBe(0)

    void clientB.invalidateQueries({ queryKey: consumer.queryKey })
    expect(consumer.queryCalls).toBe(3)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.queries()[0]).toBe('q-3')
    expect(consumer.shadowRoot).toHaveTextContent('data: q-3')

    consumer.queries.destroy()
    provider.remove()
  })

  it('should reparent queries controller under a different provider without cross-tree leakage', async () => {
    const key = queryKey()
    const clientA = new QueryClient()
    const clientB = new QueryClient()

    const providerA = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    providerA.client = clientA
    const providerB = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    providerB.client = clientB

    class Consumer extends LitElement {
      queryCalls = 0
      readonly queryKey = key

      readonly queries = createQueriesController(this, () => ({
        queries: [
          {
            queryKey: this.queryKey,
            queryFn: () => {
              this.queryCalls += 1
              return sleep(10).then(() => `q-${this.queryCalls}`)
            },
            retry: false,
          },
        ],
        combine: (results) => results.map((result) => result.data),
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    providerA.append(consumer)

    container.append(providerA)
    await providerA.updateComplete
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.queries()[0]).toBe('q-1')

    consumer.remove()
    expect(
      clientA
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
        ?.getObserversCount() ?? 0,
    ).toBe(0)

    providerA.remove()

    providerB.append(consumer)
    container.append(providerB)
    await providerB.updateComplete
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.queries()[0]).toBe('q-2')
    expect(consumer.queryCalls).toBe(2)
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

    consumer.queries.destroy()
    providerA.remove()
    providerB.remove()
  })
})
