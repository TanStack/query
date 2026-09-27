import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createMutationController } from '../createMutationController.js'
import { createQueryController } from '../createQueryController.js'
import { useIsFetching } from '../useIsFetching.js'
import { useIsMutating } from '../useIsMutating.js'
import { useMutationState } from '../useMutationState.js'
import { generateElementName } from './test-utils.js'
import type { IsFetchingAccessor } from '../useIsFetching.js'
import type { IsMutatingAccessor } from '../useIsMutating.js'
import type { MutationStateAccessor } from '../useMutationState.js'

const providerTagName = generateElementName()
customElements.define(providerTagName, QueryClientProvider)

describe('useIsFetching/useIsMutating/useMutationState', () => {
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

  it('should not request another update when stable mutation state selectors refresh during host update', async () => {
    class Host extends LitElement {
      updatesRequested = 0

      readonly mutationStates = useMutationState<string>(
        this,
        {
          select: (mutation) => mutation.state.status,
        },
        queryClient,
      )

      override requestUpdate(
        ...args: Parameters<LitElement['requestUpdate']>
      ): void {
        this.updatesRequested += 1
        super.requestUpdate(...args)
      }

      forceUpdate(): void {
        super.requestUpdate()
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const mutationStates = host.mutationStates

    try {
      container.append(host)
      await host.updateComplete

      await Promise.resolve()
      expect(mutationStates()).toEqual([])

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        host.forceUpdate()
        await host.updateComplete
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

    class Host extends LitElement {
      updatesRequested = 0

      readonly mutationStates = useMutationState<string>(
        this,
        {
          filters: { mutationKey },
          select: (mutation) => mutation.state.status,
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
    const mutationStates = host.mutationStates

    try {
      container.append(host)
      await host.updateComplete

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
    const key = queryKey()
    const mutationKey = queryKey()

    class Consumer extends LitElement {
      readonly queryKey = key
      readonly mutationKey = mutationKey

      readonly query = createQueryController(this, {
        queryKey: this.queryKey,
        queryFn: () => sleep(10).then(() => 'query-ok'),
        retry: false,
      })

      readonly mutation = createMutationController(this, {
        mutationKey: this.mutationKey,
        mutationFn: () => sleep(10).then(() => 'mutation-ok'),
      })

      readonly isFetching = useIsFetching(this, { queryKey: this.queryKey })

      readonly isMutating = useIsMutating(this, {
        mutationKey: this.mutationKey,
      })

      readonly mutationStatuses = useMutationState<string>(this, {
        filters: { mutationKey: this.mutationKey },
        select: (mutation) => mutation.state.status,
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.query().status).toBe('pending')
    expect(consumer.isFetching()).toBe(0)
    expect(consumer.isMutating()).toBe(0)
    expect(consumer.mutationStatuses()).toEqual([])

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)

    container.append(provider)
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
    const key = queryKey()
    const mutationKey = queryKey()
    const providerClient = new QueryClient()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = providerClient

    class Consumer extends LitElement {
      readonly queryKey = key
      readonly mutationKey = mutationKey

      readonly query = createQueryController(
        this,
        {
          queryKey: this.queryKey,
          queryFn: () => sleep(10).then(() => 'query-ok'),
          retry: false,
        },
        queryClient,
      )

      readonly mutation = createMutationController(
        this,
        {
          mutationKey: this.mutationKey,
          mutationFn: () => sleep(10).then(() => 'mutation-ok'),
        },
        queryClient,
      )

      readonly isFetching = useIsFetching(
        this,
        { queryKey: this.queryKey },
        queryClient,
      )

      readonly isMutating = useIsMutating(
        this,
        { mutationKey: this.mutationKey },
        queryClient,
      )

      readonly mutationStatuses = useMutationState<string>(
        this,
        {
          filters: { mutationKey: this.mutationKey },
          select: (mutation) => mutation.state.status,
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)

    container.append(provider)
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
    await Promise.resolve()
  })

  it('should track fetch/mutate counters and mutation state', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            return 'done'
          },
        },
        queryClient,
      )

      readonly mutation = createMutationController(
        this,
        {
          mutationFn: async (value: number) => {
            await sleep(10)
            return value + 10
          },
        },
        queryClient,
      )

      readonly isFetching = useIsFetching(this, {}, queryClient)
      readonly isMutating = useIsMutating(this, {}, queryClient)
      readonly mutationStatuses = useMutationState<string>(
        this,
        {
          select: (item) => item.state.status,
        },
        queryClient,
      )

      override render() {
        const statuses = this.mutationStatuses().join(', ') || 'none'
        return html`
          <p>fetching: ${this.isFetching()}</p>
          <p>mutating: ${this.isMutating()}</p>
          <p>statuses: ${statuses}</p>
        `
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const { query, mutation, isFetching, isMutating, mutationStatuses } = host

    await vi.advanceTimersByTimeAsync(0)
    expect(isFetching()).toBe(1)
    expect(host.shadowRoot).toHaveTextContent('fetching: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(isFetching()).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('fetching: 0')

    mutation.mutate(1)
    expect(isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(0)
    expect(host.shadowRoot).toHaveTextContent('mutating: 1')
    expect(host.shadowRoot).toHaveTextContent('statuses: pending')
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutating()).toBe(0)
    expect(mutationStatuses()).toContain('success')
    expect(host.shadowRoot).toHaveTextContent('mutating: 0')
    expect(host.shadowRoot).toHaveTextContent('statuses: success')
  })

  it('should track filters and filter reactivity in useIsFetching', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    let activeFilter: { queryKey?: ReadonlyArray<string> } = {
      queryKey: key1,
    }

    class Host extends LitElement {
      readonly query1 = createQueryController(
        this,
        {
          queryKey: key1,
          queryFn: () => sleep(10).then(() => 'a'),
        },
        queryClient,
      )

      readonly query2 = createQueryController(
        this,
        {
          queryKey: key2,
          queryFn: () => sleep(20).then(() => 'b'),
        },
        queryClient,
      )

      readonly isFetchingAll = useIsFetching(this, {}, queryClient)
      readonly isFetchingFiltered = useIsFetching(
        this,
        () => activeFilter,
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const { isFetchingAll, isFetchingFiltered } = host

    await vi.advanceTimersByTimeAsync(0)
    expect(isFetchingAll()).toBe(2)
    expect(isFetchingFiltered()).toBe(1)

    activeFilter = { queryKey: key2 }
    host.requestUpdate()
    await host.updateComplete

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
    let activeFilter: { mutationKey?: ReadonlyArray<string> } = {
      mutationKey: mutationKey1,
    }

    class Host extends LitElement {
      readonly mutationA = createMutationController(
        this,
        {
          mutationKey: mutationKey1,
          mutationFn: () => sleep(10).then(() => 1),
        },
        queryClient,
      )

      readonly mutationB = createMutationController(
        this,
        {
          mutationKey: mutationKey2,
          mutationFn: () => sleep(20).then(() => 2),
        },
        queryClient,
      )

      readonly isMutatingAll = useIsMutating(this, {}, queryClient)
      readonly isMutatingFiltered = useIsMutating(
        this,
        () => activeFilter,
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const { mutationA, mutationB, isMutatingAll, isMutatingFiltered } = host

    mutationA.mutate()
    mutationB.mutate()
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingAll()).toBe(2)
    expect(isMutatingFiltered()).toBe(1)

    activeFilter = { mutationKey: mutationKey2 }
    host.requestUpdate()
    await host.updateComplete

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
    let activeFilter: { mutationKey?: ReadonlyArray<string> } = {
      mutationKey: mutationKey1,
    }

    class Host extends LitElement {
      readonly mutationA = createMutationController(
        this,
        {
          mutationKey: mutationKey1,
          mutationFn: () => sleep(10).then(() => 'ok'),
        },
        queryClient,
      )

      readonly mutationB = createMutationController(
        this,
        {
          mutationKey: mutationKey2,
          mutationFn: () =>
            sleep(10).then(() => Promise.reject(new Error('state-b-failure'))),
        },
        queryClient,
      )

      readonly mutationStatuses = useMutationState<string>(
        this,
        {
          filters: () => activeFilter,
          select: (item) => item.state.status,
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const { mutationA, mutationB, mutationStatuses } = host

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
    host.requestUpdate()
    await host.updateComplete

    expect(mutationStatuses()).toEqual(['error'])
  })

  it('should refresh useMutationState when the select closure changes on host update', async () => {
    const mutationKey = queryKey()
    let label = 'before'

    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationKey,
          mutationFn: () => sleep(10).then(() => 'ok'),
        },
        queryClient,
      )

      readonly mutationLabels = useMutationState<string>(
        this,
        {
          filters: {
            mutationKey,
          },
          select: () => label,
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const { mutation, mutationLabels } = host

    const promise = mutation.mutateAsync(undefined)
    await vi.advanceTimersByTimeAsync(10)
    await expect(promise).resolves.toBe('ok')
    expect(mutationLabels()).toEqual(['before'])

    label = 'after'
    host.requestUpdate()
    await host.updateComplete

    expect(mutationLabels()).toEqual(['after'])

    mutation.destroy()
    mutationLabels.destroy()
  })

  it('should fail read-only helpers after the handshake and recover under a provider', async () => {
    const key = queryKey()
    const mutationKey = queryKey()

    class Consumer extends LitElement {
      readonly queryKey = key
      readonly mutationKey = mutationKey

      readonly query = createQueryController(this, {
        queryKey: this.queryKey,
        queryFn: () => sleep(10).then(() => 'query-ok'),
        retry: false,
      })

      readonly mutation = createMutationController(this, {
        mutationKey: this.mutationKey,
        mutationFn: () => sleep(10).then(() => 'mutation-ok'),
      })

      readonly isFetching = useIsFetching(this, { queryKey: this.queryKey })

      readonly isMutating = useIsMutating(this, {
        mutationKey: this.mutationKey,
      })

      readonly mutationStatuses = useMutationState<string>(this, {
        filters: { mutationKey: this.mutationKey },
        select: (mutation) => mutation.state.status,
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.query().status).toBe('pending')
    expect(consumer.isFetching()).toBe(0)
    expect(consumer.isMutating()).toBe(0)
    expect(consumer.mutationStatuses()).toEqual([])

    container.append(consumer)

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

    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    expect(consumer.isFetching()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.isFetching()).toBe(0)
    expect(consumer.isMutating()).toBe(0)
    expect(consumer.mutationStatuses()).toEqual([])

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

    class Producer extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'query-ok'),
          retry: false,
        },
        queryClient,
      )

      readonly mutation = createMutationController(
        this,
        {
          mutationKey,
          mutationFn: () => sleep(10).then(() => 'mutation-ok'),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Producer)
    const producer = new Producer()
    container.append(producer)
    const producerMutation = producer.mutation

    await vi.advanceTimersByTimeAsync(0)
    expect(queryClient.isFetching()).toBe(1)

    producerMutation.mutate()
    expect(queryClient.isMutating()).toBe(1)

    class Host extends LitElement {
      isFetching?: IsFetchingAccessor
      isMutating?: IsMutatingAccessor
      mutationStatuses?: MutationStateAccessor<string>
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    await host.updateComplete

    // Lit calls hostConnected immediately when a controller is added to an
    // already-connected host
    host.isFetching = useIsFetching(host, {}, queryClient)
    host.isMutating = useIsMutating(host, {}, queryClient)
    host.mutationStatuses = useMutationState<string>(
      host,
      {
        filters: { mutationKey },
        select: (mutation) => mutation.state.status,
      },
      queryClient,
    )
    const { isFetching, isMutating, mutationStatuses } = host

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
