import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createMutationController } from '../createMutationController.js'
import { useMutationState } from '../useMutationState.js'
import { generateElementName } from './utils.js'
import type { MutationStateAccessor } from '../useMutationState.js'

const providerTagName = generateElementName()
customElements.define(providerTagName, QueryClientProvider)

describe('useMutationState', () => {
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
      static override properties = { count: { type: Number } }

      declare count: number

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
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const mutationStates = host.mutationStates

    try {
      container.append(host)
      await host.updateComplete
      await vi.advanceTimersByTimeAsync(0)
      expect(mutationStates()).toEqual([])

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        host.count = i
        await host.updateComplete
      }
      expect(host.updatesRequested).toBe(5)
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
      await vi.advanceTimersByTimeAsync(0)
      expect(mutationStates()).toEqual(['idle'])

      host.updatesRequested = 0

      for (let i = 0; i < 5; i += 1) {
        queryClient.getMutationCache().notify({
          type: 'updated',
          mutation,
          action: { type: 'pause' } as never,
        })
        await vi.advanceTimersByTimeAsync(0)
      }
      expect(host.updatesRequested).toBe(0)
      expect(mutationStates()).toEqual(['idle'])
    } finally {
      mutationStates.destroy()
    }
  })

  it('should keep the pre-connect placeholder empty until a provider binds', async () => {
    const mutationKey = queryKey()

    class Consumer extends LitElement {
      readonly mutationKey = mutationKey

      readonly mutation = createMutationController(this, {
        mutationKey: this.mutationKey,
        mutationFn: () => sleep(10).then(() => 'mutation-ok'),
      })

      readonly mutationStatuses = useMutationState<string>(this, {
        filters: { mutationKey: this.mutationKey },
        select: (mutation) => mutation.state.status,
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.mutationStatuses()).toEqual([])

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    consumer.mutation.mutate()
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.mutationStatuses()).toContain('success')

    consumer.mutation.destroy()
    consumer.mutationStatuses.destroy()
    provider.remove()
  })

  it('should prefer an explicit client over the provider context', async () => {
    const mutationKey = queryKey()
    const providerClient = new QueryClient()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = providerClient

    class Consumer extends LitElement {
      readonly mutationKey = mutationKey

      readonly mutation = createMutationController(
        this,
        {
          mutationKey: this.mutationKey,
          mutationFn: () => sleep(10).then(() => 'mutation-ok'),
        },
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

    consumer.mutation.mutate()
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.mutationStatuses()).toEqual(['success'])

    consumer.mutation.destroy()
    consumer.mutationStatuses.destroy()
    provider.remove()
  })

  it('should track mutation state', async () => {
    class Producer extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (value: number) => sleep(10).then(() => value + 10),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Producer)

    class Host extends LitElement {
      readonly mutationStatuses = useMutationState<string>(
        this,
        {
          select: (item) => item.state.status,
        },
        queryClient,
      )

      override render() {
        const statuses = this.mutationStatuses().join(', ') || 'none'
        return html`<p>statuses: ${statuses}</p>`
      }
    }
    customElements.define(generateElementName(), Host)
    const producer = new Producer()
    const host = new Host()
    container.append(producer, host)
    const { mutation } = producer
    const { mutationStatuses } = host

    mutation.mutate(1)
    await vi.advanceTimersByTimeAsync(0)
    expect(host.shadowRoot).toHaveTextContent('statuses: pending')
    await vi.advanceTimersByTimeAsync(10)
    expect(mutationStatuses()).toContain('success')
    expect(host.shadowRoot).toHaveTextContent('statuses: success')
  })

  it('should return the current mutation states when connected after a mutation started', async () => {
    class Producer extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (value: number) => sleep(10).then(() => value + 10),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Producer)

    class Host extends LitElement {
      readonly mutationStates = useMutationState(
        this,
        {
          filters: { status: 'pending' },
        },
        queryClient,
      )

      override render() {
        return html`<p>pending: ${this.mutationStates().length}</p>`
      }
    }
    customElements.define(generateElementName(), Host)
    const producer = new Producer()
    const host = new Host()
    container.append(producer)
    const { mutation } = producer
    await producer.updateComplete

    mutation.mutate(1)
    container.append(host)
    await vi.advanceTimersByTimeAsync(0)
    expect(host.shadowRoot).toHaveTextContent('pending: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(host.shadowRoot).toHaveTextContent('pending: 0')
  })

  it('should not process mutation cache updates while disconnected', async () => {
    class Producer extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (value: number) => sleep(10).then(() => value + 10),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Producer)

    class Host extends LitElement {
      updatesRequested = 0

      readonly mutationStatuses = useMutationState<string>(
        this,
        {
          select: (item) => item.state.status,
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
    const producer = new Producer()
    const host = new Host()
    container.append(producer, host)
    const { mutation } = producer
    await host.updateComplete

    host.remove()
    await host.updateComplete
    const updatesAfterDisconnect = host.updatesRequested

    mutation.mutate(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(host.updatesRequested).toBe(updatesAfterDisconnect)
  })

  it('should return the states of all mutations when options are omitted', async () => {
    class Producer extends LitElement {
      readonly mutation1 = createMutationController(this, {
        mutationKey: queryKey(),
        mutationFn: () => sleep(10).then(() => 'data1'),
      })

      readonly mutation2 = createMutationController(this, {
        mutationKey: queryKey(),
        mutationFn: () => sleep(10).then(() => 'data2'),
      })
    }
    customElements.define(generateElementName(), Producer)

    class Host extends LitElement {
      readonly mutationStates = useMutationState(this)

      override render() {
        const statuses = this.mutationStates()
          .map((state) => state.status)
          .join(', ')
        return html`<p>statuses: ${statuses || 'none'}</p>`
      }
    }
    customElements.define(generateElementName(), Host)
    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    const producer = new Producer()
    const host = new Host()
    provider.append(producer, host)

    container.append(provider)
    await provider.updateComplete
    expect(host.shadowRoot).toHaveTextContent('statuses: none')

    producer.mutation1.mutate()
    producer.mutation2.mutate()
    await vi.advanceTimersByTimeAsync(0)
    expect(host.shadowRoot).toHaveTextContent('statuses: pending, pending')
    await vi.advanceTimersByTimeAsync(10)
    expect(host.shadowRoot).toHaveTextContent('statuses: success, success')
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

      override render() {
        const statuses = this.mutationStatuses().join(', ') || 'none'
        return html`<p>statuses: ${statuses}</p>`
      }
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
    expect(host.shadowRoot).toHaveTextContent('statuses: success')

    activeFilter = { mutationKey: mutationKey2 }
    host.requestUpdate()
    await host.updateComplete
    expect(mutationStatuses()).toEqual(['error'])
    expect(host.shadowRoot).toHaveTextContent('statuses: error')
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

      override render() {
        const labels = this.mutationLabels().join(', ') || 'none'
        return html`<p>labels: ${labels}</p>`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const { mutation, mutationLabels } = host

    const promise = mutation.mutateAsync(undefined)
    await vi.advanceTimersByTimeAsync(10)
    await expect(promise).resolves.toBe('ok')
    expect(mutationLabels()).toEqual(['before'])
    expect(host.shadowRoot).toHaveTextContent('labels: before')

    label = 'after'
    host.requestUpdate()
    await host.updateComplete
    expect(mutationLabels()).toEqual(['after'])
    expect(host.shadowRoot).toHaveTextContent('labels: after')

    mutation.destroy()
    mutationLabels.destroy()
  })

  it('should fail after the handshake and recover under a provider', async () => {
    const mutationKey = queryKey()

    class Consumer extends LitElement {
      readonly mutationKey = mutationKey

      readonly mutationStatuses = useMutationState<string>(this, {
        filters: { mutationKey: this.mutationKey },
        select: (mutation) => mutation.state.status,
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.mutationStatuses()).toEqual([])

    container.append(consumer)
    await vi.advanceTimersByTimeAsync(0)
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
    expect(consumer.mutationStatuses()).toEqual([])

    consumer.mutationStatuses.destroy()
    provider.remove()
  })

  it('should not throw on an already-connected host with an explicit client', async () => {
    const mutationKey = queryKey()

    class Producer extends LitElement {
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

    producerMutation.mutate()

    class Host extends LitElement {
      mutationStatuses?: MutationStateAccessor<string>
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    await host.updateComplete

    // Lit calls hostConnected immediately when a controller is added to an
    // already-connected host
    host.mutationStatuses = useMutationState<string>(
      host,
      {
        filters: { mutationKey },
        select: (mutation) => mutation.state.status,
      },
      queryClient,
    )
    const { mutationStatuses } = host
    expect(mutationStatuses()).toContain('pending')
    await vi.advanceTimersByTimeAsync(10)
    expect(mutationStatuses()).toContain('success')

    mutationStatuses.destroy()
    producerMutation.destroy()
  })
})
