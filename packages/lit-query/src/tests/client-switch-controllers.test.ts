import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { createMutationController } from '../createMutationController.js'
import { createQueriesController } from '../createQueriesController.js'

const providerTagName = 'test-query-client-provider-switch'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

class BaseControllerHostElement
  extends HTMLElement
  implements ReactiveControllerHost
{
  private readonly controllers = new Set<ReactiveController>()

  updatesRequested = 0
  readonly updateComplete: Promise<boolean> = Promise.resolve(true)

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

const switchMutationKey = queryKey()

class MutationSwitchHostElement extends BaseControllerHostElement {
  mutationCalls = 0
  readonly mutationKey = switchMutationKey

  readonly mutation = createMutationController(this, () => ({
    mutationKey: this.mutationKey,
    mutationFn: async (value: number) => {
      this.mutationCalls += 1
      await sleep(10)
      return value + 1
    },
  }))
}

const mutationHostTagName = 'test-mutation-switch-host'
if (!customElements.get(mutationHostTagName)) {
  customElements.define(mutationHostTagName, MutationSwitchHostElement)
}

const switchQueriesKey = queryKey()

class QueriesSwitchHostElement extends BaseControllerHostElement {
  queryCalls = 0
  readonly queryKey = switchQueriesKey

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

const queriesHostTagName = 'test-queries-switch-host'
if (!customElements.get(queriesHostTagName)) {
  customElements.define(queriesHostTagName, QueriesSwitchHostElement)
}

const switchInfiniteKey = queryKey()

class InfiniteSwitchHostElement extends BaseControllerHostElement {
  pageCalls = 0
  readonly queryKey = switchInfiniteKey

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

const infiniteHostTagName = 'test-infinite-switch-host'
if (!customElements.get(infiniteHostTagName)) {
  customElements.define(infiniteHostTagName, InfiniteSwitchHostElement)
}

describe('LQ-003 client-switch coverage across controllers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should switch mutation controller to new provider client while connected', async () => {
    const clientA = new QueryClient()
    const clientB = new QueryClient()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = clientA
    document.body.append(provider)
    await provider.updateComplete

    const consumer = document.createElement(
      mutationHostTagName,
    ) as MutationSwitchHostElement
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
    document.body.append(provider)
    await provider.updateComplete

    const consumer = document.createElement(
      queriesHostTagName,
    ) as QueriesSwitchHostElement
    provider.append(consumer)

    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.queries()[0]).toBe('q-1')

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

    const cacheAEntryAfterSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(cacheAEntryAfterSwitch?.getObserversCount() ?? 0).toBe(0)

    void clientB.invalidateQueries({ queryKey: consumer.queryKey })
    expect(consumer.queryCalls).toBe(3)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.queries()[0]).toBe('q-3')

    consumer.queries.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should switch infinite query controller to new provider client while connected', async () => {
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
    document.body.append(provider)
    await provider.updateComplete

    const consumer = document.createElement(
      infiniteHostTagName,
    ) as InfiniteSwitchHostElement
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

    const consumer = document.createElement(
      mutationHostTagName,
    ) as MutationSwitchHostElement
    providerA.append(consumer)

    document.body.append(providerA)
    await providerA.updateComplete

    await Promise.resolve()
    await Promise.resolve()
    const firstMutation = consumer.mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(firstMutation).resolves.toBe(2)

    consumer.remove()
    providerA.remove()

    providerB.append(consumer)
    document.body.append(providerB)
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
      queriesHostTagName,
    ) as QueriesSwitchHostElement
    providerA.append(consumer)

    document.body.append(providerA)
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
    document.body.append(providerB)
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
      infiniteHostTagName,
    ) as InfiniteSwitchHostElement
    providerA.append(consumer)

    document.body.append(providerA)
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
    document.body.append(providerB)
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
