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
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should not request another update when stable mutation state selectors refresh during host update', async () => {
    const host = new TestControllerHost()
    const mutationStates = useMutationState<string>(
      host,
      {
        select: (mutation) => mutation.state.status,
      },
      queryClient,
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
    const mutationKey = queryKey()
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationKey,
    })

    const host = new TestControllerHost()
    const mutationStates = useMutationState<string>(
      host,
      {
        filters: { mutationKey },
        select: (mutation) => mutation.state.status,
      },
      queryClient,
    )

    try {
      host.connect()

      await Promise.resolve()
      expect(mutationStates()).toEqual(['idle'])

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        queryClient.getMutationCache().notify({
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

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
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
    const providerClient = new QueryClient()
    explicitCountersClient = queryClient

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
      queryClient.getQueryCache().find({ queryKey: consumer.queryKey })?.state
        .data,
    ).toBe('query-ok')
    expect(
      providerClient.getQueryCache().find({ queryKey: consumer.queryKey }),
    ).toBeUndefined()
    expect(
      queryClient
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
      queryClient,
    )

    const mutation = createMutationController(
      host,
      {
        mutationFn: async (value: number) => {
          await sleep(10)
          return value + 10
        },
      },
      queryClient,
    )

    const isFetching = useIsFetching(host, {}, queryClient)
    const isMutating = useIsMutating(host, {}, queryClient)
    const mutationStatuses = useMutationState<string>(
      host,
      {
        select: (item) => item.state.status,
      },
      queryClient,
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
      queryClient,
    )

    createQueryController(
      host,
      {
        queryKey: key2,
        queryFn: () => sleep(20).then(() => 'b'),
      },
      queryClient,
    )

    const isFetchingAll = useIsFetching(host, {}, queryClient)
    const isFetchingFiltered = useIsFetching(
      host,
      () => activeFilter,
      queryClient,
    )

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
      queryClient,
    )

    const mutationB = createMutationController(
      host,
      {
        mutationKey: mutationKey2,
        mutationFn: () => sleep(20).then(() => 2),
      },
      queryClient,
    )

    const isMutatingAll = useIsMutating(host, {}, queryClient)
    const isMutatingFiltered = useIsMutating(
      host,
      () => activeFilter,
      queryClient,
    )

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
      queryClient,
    )

    const mutationB = createMutationController(
      host,
      {
        mutationKey: mutationKey2,
        mutationFn: () =>
          sleep(10).then(() => Promise.reject(new Error('state-b-failure'))),
      },
      queryClient,
    )

    const mutationStatuses = useMutationState<string>(
      host,
      {
        filters: () => activeFilter,
        select: (item) => item.state.status,
      },
      queryClient,
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
    const host = new TestControllerHost()
    let label = 'before'

    const mutation = createMutationController(
      host,
      {
        mutationKey,
        mutationFn: () => sleep(10).then(() => 'ok'),
      },
      queryClient,
    )

    const mutationLabels = useMutationState<string>(
      host,
      {
        filters: {
          mutationKey,
        },
        select: () => label,
      },
      queryClient,
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

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
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

    const producerHost = new TestControllerHost()

    createQueryController(
      producerHost,
      {
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'query-ok'),
        retry: false,
      },
      queryClient,
    )

    const producerMutation = createMutationController(
      producerHost,
      {
        mutationKey,
        mutationFn: () => sleep(10).then(() => 'mutation-ok'),
      },
      queryClient,
    )

    producerHost.connect()
    producerHost.update()

    await vi.advanceTimersByTimeAsync(0)
    expect(queryClient.isFetching()).toBe(1)

    producerMutation.mutate()
    expect(queryClient.isMutating()).toBe(1)

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
    const isFetching = useIsFetching(host, {}, queryClient)
    const isMutating = useIsMutating(host, {}, queryClient)
    const mutationStatuses = useMutationState<string>(
      host,
      {
        filters: { mutationKey },
        select: (mutation) => mutation.state.status,
      },
      queryClient,
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
