import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { createMutationController } from '../createMutationController.js'
import { createQueriesController } from '../createQueriesController.js'
import { waitFor } from './testHost.js'

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

class MutationSwitchHostElement extends BaseControllerHostElement {
  mutationCalls = 0
  readonly mutationKey = ['switch-mutation'] as const

  readonly mutation = createMutationController(this, () => ({
    mutationKey: this.mutationKey,
    mutationFn: async (value: number) => {
      this.mutationCalls += 1
      return value + 1
    },
  }))
}

const mutationHostTagName = 'test-mutation-switch-host'
if (!customElements.get(mutationHostTagName)) {
  customElements.define(mutationHostTagName, MutationSwitchHostElement)
}

class QueriesSwitchHostElement extends BaseControllerHostElement {
  queryCalls = 0
  readonly queryKey = ['switch-queries'] as const

  readonly queries = createQueriesController(this, () => ({
    queries: [
      {
        queryKey: this.queryKey,
        queryFn: async () => {
          this.queryCalls += 1
          return `q-${this.queryCalls}`
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

class InfiniteSwitchHostElement extends BaseControllerHostElement {
  pageCalls = 0
  readonly queryKey = ['switch-infinite'] as const

  readonly infinite = createInfiniteQueryController(this, () => ({
    queryKey: this.queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      this.pageCalls += 1
      return Number(pageParam)
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
  it('switches mutation controller to new provider client while connected', async () => {
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
    await expect(consumer.mutation.mutateAsync(1)).resolves.toBe(2)

    const countAAfterFirst = clientA
      .getMutationCache()
      .findAll({ mutationKey: consumer.mutationKey }).length
    expect(countAAfterFirst).toBeGreaterThan(0)

    provider.client = clientB
    await provider.updateComplete
    await Promise.resolve()

    await expect(consumer.mutation.mutateAsync(2)).resolves.toBe(3)

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

  it('switches queries controller to new provider client while connected', async () => {
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
    await waitFor(() => typeof consumer.queries()[0] === 'string')

    const cacheAEntryBeforeSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(cacheAEntryBeforeSwitch?.getObserversCount()).toBe(1)

    provider.client = clientB
    await provider.updateComplete

    await waitFor(() => {
      const cacheBEntry = clientB
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
      return Boolean(cacheBEntry && cacheBEntry.getObserversCount() === 1)
    })

    const cacheAEntryAfterSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(cacheAEntryAfterSwitch?.getObserversCount() ?? 0).toBe(0)

    void clientB.invalidateQueries({ queryKey: consumer.queryKey })
    await waitFor(() => consumer.queryCalls >= 2)

    consumer.queries.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('switches infinite query controller to new provider client while connected', async () => {
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
    await waitFor(() => consumer.infinite().isSuccess)
    expect(consumer.infinite().data?.pages).toEqual([0])

    const cacheAEntryBeforeSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(cacheAEntryBeforeSwitch?.getObserversCount()).toBe(1)

    provider.client = clientB
    await provider.updateComplete

    await waitFor(() => {
      const cacheBEntry = clientB
        .getQueryCache()
        .find({ queryKey: consumer.queryKey })
      return Boolean(cacheBEntry && cacheBEntry.getObserversCount() === 1)
    })
    await waitFor(
      () =>
        consumer.infinite().isSuccess &&
        (consumer.infinite().data?.pages.length ?? 0) >= 1,
      4000,
    )
    await waitFor(() => consumer.infinite().hasNextPage === true, 4000)

    const cacheAEntryAfterSwitch = clientA
      .getQueryCache()
      .find({ queryKey: consumer.queryKey })
    expect(cacheAEntryAfterSwitch?.getObserversCount() ?? 0).toBe(0)

    await consumer.infinite.fetchNextPage()
    await waitFor(() => consumer.infinite().data?.pages.length === 2, 4000)
    expect(consumer.infinite().data?.pages).toEqual([0, 1])

    consumer.infinite.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('reparents mutation controller under a different provider and binds the new nearest client', async () => {
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

    await expect(consumer.mutation.mutateAsync(1)).resolves.toBe(2)

    consumer.remove()
    await new Promise((resolve) => setTimeout(resolve, 0))
    providerA.remove()

    providerB.append(consumer)
    document.body.append(providerB)
    await providerB.updateComplete
    await Promise.resolve()
    await Promise.resolve()

    await expect(consumer.mutation.mutateAsync(2)).resolves.toBe(3)
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

  it('reparents queries controller under a different provider without cross-tree leakage', async () => {
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

    await waitFor(() => typeof consumer.queries()[0] === 'string')

    consumer.remove()
    await waitFor(
      () =>
        (clientA
          .getQueryCache()
          .find({ queryKey: consumer.queryKey })
          ?.getObserversCount() ?? 0) === 0,
    )
    providerA.remove()

    providerB.append(consumer)
    document.body.append(providerB)
    await providerB.updateComplete
    await waitFor(
      () =>
        typeof consumer.queries()[0] === 'string' && consumer.queryCalls >= 2,
    )

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

  it('reparents infinite query controller under a different provider and binds the new nearest client', async () => {
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

    await waitFor(() => consumer.infinite().isSuccess)

    consumer.remove()
    await waitFor(
      () =>
        (clientA
          .getQueryCache()
          .find({ queryKey: consumer.queryKey })
          ?.getObserversCount() ?? 0) === 0,
    )
    providerA.remove()

    providerB.append(consumer)
    document.body.append(providerB)
    await providerB.updateComplete
    await waitFor(
      () =>
        consumer.infinite().isSuccess &&
        (consumer.infinite().data?.pages.length ?? 0) >= 1 &&
        consumer.pageCalls >= 2,
    )

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
