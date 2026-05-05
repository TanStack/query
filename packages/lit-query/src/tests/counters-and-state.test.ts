import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createMutationController } from '../createMutationController.js'
import { createQueryController } from '../createQueryController.js'
import { useIsFetching } from '../useIsFetching.js'
import { useIsMutating } from '../useIsMutating.js'
import { useMutationState } from '../useMutationState.js'
import {
  TestControllerHost,
  TestElementHost,
  waitFor,
  waitForMissingQueryClient,
} from './testHost.js'

const providerTagName = 'test-query-client-provider-counters'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

let explicitCountersClient: QueryClient | undefined

class ContextCountersHostElement extends TestElementHost {
  readonly queryKey = ['context-counters', 'query'] as const
  readonly mutationKey = ['context-counters', 'mutation'] as const

  private resolveQuery: (() => void) | undefined
  private resolveMutation: (() => void) | undefined

  readonly query = createQueryController(
    this,
    {
      queryKey: this.queryKey,
      queryFn: () =>
        new Promise<string>((resolve) => {
          this.resolveQuery = () => resolve('query-ok')
        }),
      retry: false,
    },
    explicitCountersClient,
  )

  readonly mutation = createMutationController(
    this,
    {
      mutationKey: this.mutationKey,
      mutationFn: () =>
        new Promise<string>((resolve) => {
          this.resolveMutation = () => resolve('mutation-ok')
        }),
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

  resolvePendingQuery(): void {
    this.resolveQuery?.()
  }

  resolvePendingMutation(): void {
    this.resolveMutation?.()
  }
}

const contextCountersTagName = 'test-context-counters-host'
if (!customElements.get(contextCountersTagName)) {
  customElements.define(contextCountersTagName, ContextCountersHostElement)
}

describe('useIsFetching/useIsMutating/useMutationState', () => {
  it('LC-COUNTERS-01: pre-connect placeholders stay zero/empty until a provider binds', async () => {
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

    await waitFor(() => consumer.isFetching() === 1)
    consumer.resolvePendingQuery()
    await waitFor(() => consumer.query().isSuccess)
    await waitFor(() => consumer.isFetching() === 0)

    consumer.mutation.mutate()
    await waitFor(() => consumer.isMutating() === 1)
    consumer.resolvePendingMutation()
    await waitFor(() => consumer.isMutating() === 0)
    await waitFor(() => consumer.mutationStatuses().includes('success'))

    consumer.query.destroy()
    consumer.mutation.destroy()
    consumer.isFetching.destroy()
    consumer.isMutating.destroy()
    consumer.mutationStatuses.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('LC-COUNTERS-02: explicit client takes precedence over provider context', async () => {
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

    await waitFor(() => consumer.isFetching() === 1)
    consumer.resolvePendingQuery()
    await waitFor(() => consumer.query().isSuccess)

    consumer.mutation.mutate()
    await waitFor(() => consumer.isMutating() === 1)
    consumer.resolvePendingMutation()
    await waitFor(() => consumer.isMutating() === 0)

    expect(
      explicitClient.getQueryCache().find({ queryKey: consumer.queryKey }),
    ).toBeDefined()
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

  it('tracks fetch/mutate counters and mutation state', async () => {
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
        queryKey: ['counter-test'],
        queryFn: async () => {
          await new Promise((resolve) => setTimeout(resolve, 40))
          return 'done'
        },
      },
      client,
    )

    const mutation = createMutationController(
      host,
      {
        mutationFn: async (value: number) => {
          await new Promise((resolve) => setTimeout(resolve, 40))
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

    await waitFor(() => isFetching() === 1)
    await waitFor(() => query().isSuccess)
    await waitFor(() => isFetching() === 0)

    mutation.mutate(1)
    await waitFor(() => isMutating() === 1)
    await waitFor(() => isMutating() === 0)
    await waitFor(() => mutationStatuses().includes('success'))
  })

  it('S1: useIsFetching tracks filters and filter reactivity', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const host = new TestControllerHost()
    let resolveA: (() => void) | undefined
    let resolveB: (() => void) | undefined
    let activeFilter: { queryKey?: readonly string[] } = {
      queryKey: ['fetch-a'],
    }

    createQueryController(
      host,
      {
        queryKey: ['fetch-a'],
        queryFn: () =>
          new Promise<string>((resolve) => {
            resolveA = () => resolve('a')
          }),
      },
      client,
    )

    createQueryController(
      host,
      {
        queryKey: ['fetch-b'],
        queryFn: () =>
          new Promise<string>((resolve) => {
            resolveB = () => resolve('b')
          }),
      },
      client,
    )

    const isFetchingAll = useIsFetching(host, {}, client)
    const isFetchingFiltered = useIsFetching(host, () => activeFilter, client)

    host.connect()
    host.update()

    await waitFor(() => isFetchingAll() === 2)
    await waitFor(() => isFetchingFiltered() === 1)

    activeFilter = { queryKey: ['fetch-b'] }
    host.update()
    await waitFor(() => isFetchingFiltered() === 1)

    resolveA?.()
    await waitFor(() => isFetchingAll() === 1)
    await waitFor(() => isFetchingFiltered() === 1)

    resolveB?.()
    await waitFor(() => isFetchingAll() === 0)
    await waitFor(() => isFetchingFiltered() === 0)
  })

  it('S2: useIsMutating tracks mutation filters and reactivity', async () => {
    const client = new QueryClient()
    const host = new TestControllerHost()
    let resolveA: (() => void) | undefined
    let resolveB: (() => void) | undefined
    let activeFilter: { mutationKey?: readonly string[] } = {
      mutationKey: ['mut-a'],
    }

    const mutationA = createMutationController(
      host,
      {
        mutationKey: ['mut-a'],
        mutationFn: () =>
          new Promise<number>((resolve) => {
            resolveA = () => resolve(1)
          }),
      },
      client,
    )

    const mutationB = createMutationController(
      host,
      {
        mutationKey: ['mut-b'],
        mutationFn: () =>
          new Promise<number>((resolve) => {
            resolveB = () => resolve(2)
          }),
      },
      client,
    )

    const isMutatingAll = useIsMutating(host, {}, client)
    const isMutatingFiltered = useIsMutating(host, () => activeFilter, client)

    host.connect()
    host.update()

    mutationA.mutate()
    mutationB.mutate()

    await waitFor(() => isMutatingAll() === 2)
    await waitFor(() => isMutatingFiltered() === 1)

    activeFilter = { mutationKey: ['mut-b'] }
    host.update()
    await waitFor(() => isMutatingFiltered() === 1)

    resolveA?.()
    await waitFor(() => isMutatingAll() === 1)
    await waitFor(() => isMutatingFiltered() === 1)

    resolveB?.()
    await waitFor(() => isMutatingAll() === 0)
    await waitFor(() => isMutatingFiltered() === 0)
  })

  it('S3: useMutationState selects and filters by mutation key/status', async () => {
    const client = new QueryClient()
    const host = new TestControllerHost()
    let activeFilter: { mutationKey?: readonly string[] } = {
      mutationKey: ['state-a'],
    }

    const mutationA = createMutationController(
      host,
      {
        mutationKey: ['state-a'],
        mutationFn: async () => 'ok',
      },
      client,
    )

    const mutationB = createMutationController(
      host,
      {
        mutationKey: ['state-b'],
        mutationFn: async () => {
          throw new Error('state-b-failure')
        },
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

    await expect(mutationA.mutateAsync(undefined)).resolves.toBe('ok')
    await expect(mutationB.mutateAsync(undefined)).rejects.toThrow(
      'state-b-failure',
    )

    await waitFor(
      () =>
        mutationStatuses().length === 1 && mutationStatuses()[0] === 'success',
    )

    activeFilter = { mutationKey: ['state-b'] }
    host.update()

    await waitFor(
      () =>
        mutationStatuses().length === 1 && mutationStatuses()[0] === 'error',
    )
  })

  it('S4: useMutationState refreshes when the select closure changes on host update', async () => {
    const client = new QueryClient()
    const host = new TestControllerHost()
    let label = 'before'

    const mutation = createMutationController(
      host,
      {
        mutationKey: ['state-select-reactivity'],
        mutationFn: async () => 'ok',
      },
      client,
    )

    const mutationLabels = useMutationState<string>(
      host,
      {
        filters: {
          mutationKey: ['state-select-reactivity'],
        },
        select: () => label,
      },
      client,
    )

    host.connect()
    host.update()

    await expect(mutation.mutateAsync(undefined)).resolves.toBe('ok')
    await waitFor(
      () => mutationLabels().length === 1 && mutationLabels()[0] === 'before',
    )

    label = 'after'
    host.update()

    await waitFor(
      () => mutationLabels().length === 1 && mutationLabels()[0] === 'after',
    )

    mutation.destroy()
    mutationLabels.destroy()
  })

  it('LC-COUNTERS-03: read-only helpers fail after handshake and recover under a provider', async () => {
    const consumer = document.createElement(
      contextCountersTagName,
    ) as ContextCountersHostElement

    expect(consumer.query().status).toBe('pending')
    expect(consumer.isFetching()).toBe(0)
    expect(consumer.isMutating()).toBe(0)
    expect(consumer.mutationStatuses()).toEqual([])

    document.body.append(consumer)
    await waitForMissingQueryClient(() => consumer.query())

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

    await waitFor(() => consumer.isFetching() === 1)
    consumer.resolvePendingQuery()
    await waitFor(() => consumer.query().isSuccess)
    await waitFor(() => consumer.isFetching() === 0)

    consumer.query.destroy()
    consumer.mutation.destroy()
    consumer.isFetching.destroy()
    consumer.isMutating.destroy()
    consumer.mutationStatuses.destroy()
    provider.remove()
    await Promise.resolve()
  })

  it('ALREADYCONN-COUNTERS-01: read-only helpers on already-connected host with explicit client do not throw', async () => {
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
    let resolveQuery: (() => void) | undefined
    let resolveMutation: (() => void) | undefined

    createQueryController(
      producerHost,
      {
        queryKey: ['already-connected-counters-query'],
        queryFn: () =>
          new Promise<string>((resolve) => {
            resolveQuery = () => resolve('query-ok')
          }),
        retry: false,
      },
      client,
    )

    const producerMutation = createMutationController(
      producerHost,
      {
        mutationKey: ['already-connected-counters-mutation'],
        mutationFn: () =>
          new Promise<string>((resolve) => {
            resolveMutation = () => resolve('mutation-ok')
          }),
      },
      client,
    )

    producerHost.connect()
    producerHost.update()
    await waitFor(() => client.isFetching() === 1)

    producerMutation.mutate()
    await waitFor(() => client.isMutating() === 1)

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
        filters: { mutationKey: ['already-connected-counters-mutation'] },
        select: (mutation) => mutation.state.status,
      },
      client,
    )

    await Promise.resolve()
    await Promise.resolve()

    await waitFor(() => isFetching() === 1)
    await waitFor(() => isMutating() === 1)
    await waitFor(() => mutationStatuses().includes('pending'))

    resolveQuery?.()
    resolveMutation?.()

    await waitFor(() => isFetching() === 0)
    await waitFor(() => isMutating() === 0)
    await waitFor(() => mutationStatuses().includes('success'))

    isFetching.destroy()
    isMutating.destroy()
    mutationStatuses.destroy()
    producerMutation.destroy()
  })
})
