import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createMutationController } from '../createMutationController.js'
import { createQueryController } from '../createQueryController.js'
import { useIsFetching } from '../useIsFetching.js'
import { useIsMutating } from '../useIsMutating.js'
import { useMutationState } from '../useMutationState.js'
import { TestControllerHost, TestElementHost } from './testHost.js'

const providerTagName = 'test-query-client-provider-counters'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

let explicitCountersClient: QueryClient | undefined

const contextCountersQueryKey = queryKey()
const contextCountersMutationKey = queryKey()

class ContextCountersHostElement extends TestElementHost {
  readonly queryKey = contextCountersQueryKey
  readonly mutationKey = contextCountersMutationKey

  readonly query = createQueryController(
    this,
    {
      queryKey: this.queryKey,
      queryFn: () => sleep(10).then(() => 'query-ok'),
      retry: false,
    },
    explicitCountersClient,
  )

  readonly mutation = createMutationController(
    this,
    {
      mutationKey: this.mutationKey,
      mutationFn: () => sleep(10).then(() => 'mutation-ok'),
    },
    explicitCountersClient,
  )

  readonly isFetching = useIsFetching(
    this,
    { queryKey: this.queryKey },
    explicitCountersClient,
  )

  readonly isMutating = useIsMutating(
    this,
    { mutationKey: this.mutationKey },
    explicitCountersClient,
  )

  readonly mutationStatuses = useMutationState<string>(
    this,
    {
      filters: { mutationKey: this.mutationKey },
      select: (mutation) => mutation.state.status,
    },
    explicitCountersClient,
  )
}

const contextCountersTagName = 'test-context-counters-host'
if (!customElements.get(contextCountersTagName)) {
  customElements.define(contextCountersTagName, ContextCountersHostElement)
}

describe('useIsFetching/useIsMutating/useMutationState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not request another update when stable mutation state selectors refresh during host update', async () => {
    const client = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    const mutationStates = useMutationState<string>(
      host,
      {
        select: (mutation) => mutation.state.status,
      },
      client,
    )

    try {
      host.connect()

      await Promise.resolve()
      expect(mutationStates()).toEqual([])

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        host.update()
        await Promise.resolve()
      }

      expect(host.updatesRequested).toBe(0)
      expect(mutationStates()).toEqual([])
    } finally {
      mutationStates.destroy()
    }
  })

  it('should not request another update when mutation cache emits with unchanged selected state', async () => {
    const client = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    })

    const mutationKey = queryKey()
    const mutation = client.getMutationCache().build(client, {
      mutationKey,
    })

    const host = new TestControllerHost()
    const mutationStates = useMutationState<string>(
      host,
      {
        filters: { mutationKey },
        select: (mutation) => mutation.state.status,
      },
      client,
    )

    try {
      host.connect()

      await Promise.resolve()
      expect(mutationStates()).toEqual(['idle'])

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        client.getMutationCache().notify({
          type: 'updated',
          mutation,
          action: { type: 'pause' } as never,
        })
        await Promise.resolve()
      }

      expect(host.updatesRequested).toBe(0)
      expect(mutationStates()).toEqual(['idle'])
    } finally {
      mutationStates.destroy()
    }
  })

  it('should keep pre-connect placeholders zero/empty until a provider binds', async () => {
    const consumer = document.createElement(
      contextCountersTagName,
    ) as ContextCountersHostElement

    expect(consumer.query().status).toBe('pending')
    expect(consumer.isFetching()).toBe(0)
    expect(consumer.isMutating()).toBe(0)
    expect(consumer.mutationStatuses()).toEqual([])

    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
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

    expect(consumer.isFetching()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.isFetching()).toBe(0)

    consumer.mutation.mutate()
    expect(consumer.isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.isMutating()).toBe(0)
    expect(consumer.mutationStatuses()).toContain('success')

    consumer.query.destroy()
    consumer.mutation.destroy()
    consumer.isFetching.destroy()
    consumer.isMutating.destroy()
    consumer.mutationStatuses.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should prefer an explicit client over the provider context', async () => {
    const explicitClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })
    const providerClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })
    explicitCountersClient = explicitClient

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = providerClient

    const consumer = document.createElement(
      contextCountersTagName,
    ) as ContextCountersHostElement
    provider.append(consumer)

    document.body.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    expect(consumer.isFetching()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)

    consumer.mutation.mutate()
    expect(consumer.isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.isMutating()).toBe(0)
    expect(
      explicitClient.getQueryCache().find({ queryKey: consumer.queryKey })
        ?.state.data,
    ).toBe('query-ok')
    expect(
      providerClient.getQueryCache().find({ queryKey: consumer.queryKey }),
    ).toBeUndefined()
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

    consumer.query.destroy()
    consumer.mutation.destroy()
    consumer.isFetching.destroy()
    consumer.isMutating.destroy()
    consumer.mutationStatuses.destroy()
    provider.remove()
    explicitCountersClient = undefined
    await Promise.resolve()
  })

  it('should track fetch/mutate counters and mutation state', async () => {
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
        queryFn: async () => {
          await sleep(10)
          return 'done'
        },
      },
      client,
    )

    const mutation = createMutationController(
      host,
      {
        mutationFn: async (value: number) => {
          await sleep(10)
          return value + 10
        },
      },
      client,
    )

    const isFetching = useIsFetching(host, {}, client)
    const isMutating = useIsMutating(host, {}, client)
    const mutationStatuses = useMutationState<string>(
      host,
      {
        select: (item) => item.state.status,
      },
      client,
    )

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(0)
    expect(isFetching()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(isFetching()).toBe(0)

    mutation.mutate(1)
    expect(isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutating()).toBe(0)
    expect(mutationStatuses()).toContain('success')
  })

  it('should track filters and filter reactivity in useIsFetching', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let activeFilter: { queryKey?: readonly string[] } = {
      queryKey: key1,
    }

    createQueryController(
      host,
      {
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 'a'),
      },
      client,
    )

    createQueryController(
      host,
      {
        queryKey: key2,
        queryFn: () => sleep(20).then(() => 'b'),
      },
      client,
    )

    const isFetchingAll = useIsFetching(host, {}, client)
    const isFetchingFiltered = useIsFetching(host, () => activeFilter, client)

    host.connect()
    host.update()

    await vi.advanceTimersByTimeAsync(0)
    expect(isFetchingAll()).toBe(2)
    expect(isFetchingFiltered()).toBe(1)

    activeFilter = { queryKey: key2 }
    host.update()

    expect(isFetchingFiltered()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(isFetchingAll()).toBe(1)
    expect(isFetchingFiltered()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(isFetchingAll()).toBe(0)
    expect(isFetchingFiltered()).toBe(0)
  })

  it('should track mutation filters and reactivity in useIsMutating', async () => {
    const mutationKey1 = queryKey()
    const mutationKey2 = queryKey()
    const client = new QueryClient()
    const host = new TestControllerHost()
    let activeFilter: { mutationKey?: readonly string[] } = {
      mutationKey: mutationKey1,
    }

    const mutationA = createMutationController(
      host,
      {
        mutationKey: mutationKey1,
        mutationFn: () => sleep(10).then(() => 1),
      },
      client,
    )

    const mutationB = createMutationController(
      host,
      {
        mutationKey: mutationKey2,
        mutationFn: () => sleep(20).then(() => 2),
      },
      client,
    )

    const isMutatingAll = useIsMutating(host, {}, client)
    const isMutatingFiltered = useIsMutating(host, () => activeFilter, client)

    host.connect()
    host.update()

    mutationA.mutate()
    mutationB.mutate()
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingAll()).toBe(2)
    expect(isMutatingFiltered()).toBe(1)

    activeFilter = { mutationKey: mutationKey2 }
    host.update()

    expect(isMutatingFiltered()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutatingAll()).toBe(1)
    expect(isMutatingFiltered()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutatingAll()).toBe(0)
    expect(isMutatingFiltered()).toBe(0)
  })

  it('should select and filter by mutation key/status in useMutationState', async () => {
    const mutationKey1 = queryKey()
    const mutationKey2 = queryKey()
    const client = new QueryClient()
    const host = new TestControllerHost()
    let activeFilter: { mutationKey?: readonly string[] } = {
      mutationKey: mutationKey1,
    }

    const mutationA = createMutationController(
      host,
      {
        mutationKey: mutationKey1,
        mutationFn: () => sleep(10).then(() => 'ok'),
      },
      client,
    )

    const mutationB = createMutationController(
      host,
      {
        mutationKey: mutationKey2,
        mutationFn: () =>
          sleep(10).then(() => Promise.reject(new Error('state-b-failure'))),
      },
      client,
    )

    const mutationStatuses = useMutationState<string>(
      host,
      {
        filters: () => activeFilter,
        select: (item) => item.state.status,
      },
      client,
    )

    host.connect()
    host.update()

    const promiseA = mutationA.mutateAsync(undefined)
    await vi.advanceTimersByTimeAsync(10)
    await expect(promiseA).resolves.toBe('ok')
    await Promise.all([
      expect(mutationB.mutateAsync(undefined)).rejects.toThrow(
        'state-b-failure',
      ),
      vi.advanceTimersByTimeAsync(10),
    ])
    expect(mutationStatuses()).toEqual(['success'])

    activeFilter = { mutationKey: mutationKey2 }
    host.update()

    expect(mutationStatuses()).toEqual(['error'])
  })

  it('should refresh useMutationState when the select closure changes on host update', async () => {
    const mutationKey = queryKey()
    const client = new QueryClient()
    const host = new TestControllerHost()
    let label = 'before'

    const mutation = createMutationController(
      host,
      {
        mutationKey,
        mutationFn: () => sleep(10).then(() => 'ok'),
      },
      client,
    )

    const mutationLabels = useMutationState<string>(
      host,
      {
        filters: {
          mutationKey,
        },
        select: () => label,
      },
      client,
    )

    host.connect()
    host.update()

    const promise = mutation.mutateAsync(undefined)
    await vi.advanceTimersByTimeAsync(10)
    await expect(promise).resolves.toBe('ok')
    expect(mutationLabels()).toEqual(['before'])

    label = 'after'
    host.update()

    expect(mutationLabels()).toEqual(['after'])

    mutation.destroy()
    mutationLabels.destroy()
  })

  it('should fail read-only helpers after the handshake and recover under a provider', async () => {
    const consumer = document.createElement(
      contextCountersTagName,
    ) as ContextCountersHostElement

    expect(consumer.query().status).toBe('pending')
    expect(consumer.isFetching()).toBe(0)
    expect(consumer.isMutating()).toBe(0)
    expect(consumer.mutationStatuses()).toEqual([])

    document.body.append(consumer)

    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.query()).toThrow(/No QueryClient available/)
    expect(() => consumer.isFetching()).toThrow(/No QueryClient available/)
    expect(() => consumer.isMutating()).toThrow(/No QueryClient available/)
    expect(() => consumer.mutationStatuses()).toThrow(
      /No QueryClient available/,
    )

    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
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

    expect(consumer.isFetching()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.isFetching()).toBe(0)

    consumer.query.destroy()
    consumer.mutation.destroy()
    consumer.isFetching.destroy()
    consumer.isMutating.destroy()
    consumer.mutationStatuses.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('should not throw for read-only helpers on an already-connected host with an explicit client', async () => {
    const key = queryKey()
    const mutationKey = queryKey()
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })

    const producerHost = new TestControllerHost()

    createQueryController(
      producerHost,
      {
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'query-ok'),
        retry: false,
      },
      client,
    )

    const producerMutation = createMutationController(
      producerHost,
      {
        mutationKey,
        mutationFn: () => sleep(10).then(() => 'mutation-ok'),
      },
      client,
    )

    producerHost.connect()
    producerHost.update()

    await vi.advanceTimersByTimeAsync(0)
    expect(client.isFetching()).toBe(1)

    producerMutation.mutate()
    expect(client.isMutating()).toBe(1)

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
    const isFetching = useIsFetching(host, {}, client)
    const isMutating = useIsMutating(host, {}, client)
    const mutationStatuses = useMutationState<string>(
      host,
      {
        filters: { mutationKey },
        select: (mutation) => mutation.state.status,
      },
      client,
    )

    await Promise.resolve()
    await Promise.resolve()
    expect(isFetching()).toBe(1)
    expect(isMutating()).toBe(1)
    expect(mutationStatuses()).toContain('pending')
    await vi.advanceTimersByTimeAsync(10)
    expect(isFetching()).toBe(0)
    expect(isMutating()).toBe(0)
    expect(mutationStatuses()).toContain('success')

    isFetching.destroy()
    isMutating.destroy()
    mutationStatuses.destroy()
    producerMutation.destroy()
  })
})
