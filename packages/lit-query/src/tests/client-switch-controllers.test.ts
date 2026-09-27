import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { createMutationController } from '../createMutationController.js'
import { createQueriesController } from '../createQueriesController.js'
import { generateElementName } from './test-utils.js'

const providerTagName = generateElementName()
customElements.define(providerTagName, QueryClientProvider)

describe('client switching across controllers', () => {
  let container: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(() => {
    container.remove()
    vi.useRealTimers()
  })

  it('should switch mutation controller to new provider client while connected', async () => {
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
      readonly mutationKey = key

      readonly mutation = createMutationController(this, () => ({
        mutationKey: this.mutationKey,
        mutationFn: async (value: number) => {
          await sleep(10)
          return value + 1
        },
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)

    await Promise.resolve()
    await Promise.resolve()
    const firstMutation = consumer.mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(firstMutation).resolves.toBe(2)

    const countAAfterFirst = clientA
      .getMutationCache()
      .findAll({ mutationKey: consumer.mutationKey }).length
    expect(countAAfterFirst).toBeGreaterThan(0)

    provider.client = clientB
    await provider.updateComplete
    await Promise.resolve()
    const secondMutation = consumer.mutation.mutateAsync(2)
    await vi.advanceTimersByTimeAsync(10)
    await expect(secondMutation).resolves.toBe(3)

    const countAAfterSecond = clientA
      .getMutationCache()
      .findAll({ mutationKey: consumer.mutationKey }).length
    const countBAfterSecond = clientB
      .getMutationCache()
      .findAll({ mutationKey: consumer.mutationKey }).length

    expect(countAAfterSecond).toBe(countAAfterFirst)
    expect(countBAfterSecond).toBeGreaterThan(0)

    consumer.mutation.destroy()
    provider.remove()
    await Promise.resolve()
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
        ] as const,
        combine: (results) => results.map((result) => result.data),
      }))

      override render() {
        return html`data: ${this.queries()[0] ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)

    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.queries()[0]).toBe('q-1')
    expect(consumer.shadowRoot?.textContent).toContain('data: q-1')

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
    expect(consumer.shadowRoot?.textContent).toContain('data: q-2')

    const cacheAEntryAfterSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(cacheAEntryAfterSwitch?.getObserversCount() ?? 0).toBe(0)

    void clientB.invalidateQueries({ queryKey: consumer.queryKey })
    expect(consumer.queryCalls).toBe(3)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.queries()[0]).toBe('q-3')
    expect(consumer.shadowRoot?.textContent).toContain('data: q-3')

    consumer.queries.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should switch infinite query controller to new provider client while connected', async () => {
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
      pageCalls = 0
      readonly queryKey = key

      readonly infinite = createInfiniteQueryController(this, () => ({
        queryKey: this.queryKey,
        initialPageParam: 0,
        queryFn: ({ pageParam }) => {
          this.pageCalls += 1
          return sleep(10).then(() => Number(pageParam))
        },
        getNextPageParam: (lastPage: number) =>
          lastPage < 1 ? lastPage + 1 : undefined,
        retry: false,
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)

    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.infinite().isSuccess).toBe(true)
    expect(consumer.infinite().data?.pages).toEqual([0])

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
    expect(consumer.infinite().isSuccess).toBe(true)
    expect(consumer.infinite().data?.pages).toEqual([0])
    expect(consumer.infinite().hasNextPage).toBe(true)

    const cacheAEntryAfterSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(cacheAEntryAfterSwitch?.getObserversCount() ?? 0).toBe(0)

    void consumer.infinite.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.infinite().data?.pages).toEqual([0, 1])

    consumer.infinite.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should reparent mutation controller under a different provider and bind the new nearest client', async () => {
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
      readonly mutationKey = key

      readonly mutation = createMutationController(this, () => ({
        mutationKey: this.mutationKey,
        mutationFn: async (value: number) => {
          await sleep(10)
          return value + 1
        },
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    providerA.append(consumer)

    container.append(providerA)
    await providerA.updateComplete

    await Promise.resolve()
    await Promise.resolve()
    const firstMutation = consumer.mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(firstMutation).resolves.toBe(2)

    consumer.remove()
    providerA.remove()

    providerB.append(consumer)
    container.append(providerB)
    await providerB.updateComplete

    await Promise.resolve()
    await Promise.resolve()
    const secondMutation = consumer.mutation.mutateAsync(2)
    await vi.advanceTimersByTimeAsync(10)
    await expect(secondMutation).resolves.toBe(3)
    expect(
      clientA.getMutationCache().findAll({ mutationKey: consumer.mutationKey })
        .length,
    ).toBeGreaterThan(0)
    expect(
      clientB.getMutationCache().findAll({ mutationKey: consumer.mutationKey })
        .length,
    ).toBeGreaterThan(0)

    consumer.mutation.destroy()
    providerB.remove()
    await Promise.resolve()
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
        ] as const,
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
    await Promise.resolve()
  })

  it('should reparent infinite query controller under a different provider and bind the new nearest client', async () => {
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
      pageCalls = 0
      readonly queryKey = key

      readonly infinite = createInfiniteQueryController(this, () => ({
        queryKey: this.queryKey,
        initialPageParam: 0,
        queryFn: ({ pageParam }) => {
          this.pageCalls += 1
          return sleep(10).then(() => Number(pageParam))
        },
        getNextPageParam: (lastPage: number) =>
          lastPage < 1 ? lastPage + 1 : undefined,
        retry: false,
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    providerA.append(consumer)

    container.append(providerA)
    await providerA.updateComplete

    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.infinite().isSuccess).toBe(true)

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
    expect(consumer.infinite().isSuccess).toBe(true)
    expect(consumer.infinite().data?.pages).toEqual([0])
    expect(consumer.pageCalls).toBe(2)
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

    consumer.infinite.destroy()
    providerA.remove()
    providerB.remove()
    await Promise.resolve()
  })
})
