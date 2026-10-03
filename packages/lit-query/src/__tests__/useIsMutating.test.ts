import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createMutationController } from '../createMutationController.js'
import { useIsMutating } from '../useIsMutating.js'
import { generateElementName } from './utils.js'
import type { IsMutatingAccessor } from '../useIsMutating.js'

const providerTagName = generateElementName()
customElements.define(providerTagName, QueryClientProvider)

describe('useIsMutating', () => {
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

  it('should keep the pre-connect placeholder zero until a provider binds', async () => {
    const mutationKey = queryKey()

    class Consumer extends LitElement {
      readonly mutationKey = mutationKey

      readonly mutation = createMutationController(this, {
        mutationKey: this.mutationKey,
        mutationFn: () => sleep(10).then(() => 'mutation-ok'),
      })

      readonly isMutating = useIsMutating(this, {
        mutationKey: this.mutationKey,
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.isMutating()).toBe(0)

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)
    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    consumer.mutation.mutate()
    expect(consumer.isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.isMutating()).toBe(0)

    consumer.mutation.destroy()
    consumer.isMutating.destroy()
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

      readonly isMutating = useIsMutating(
        this,
        { mutationKey: this.mutationKey },
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
    expect(consumer.isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.isMutating()).toBe(0)
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

    consumer.mutation.destroy()
    consumer.isMutating.destroy()
    provider.remove()
  })

  it('should track the mutating count', async () => {
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
      readonly isMutating = useIsMutating(this, {}, queryClient)

      override render() {
        return html`<p>mutating: ${this.isMutating()}</p>`
      }
    }
    customElements.define(generateElementName(), Host)
    const producer = new Producer()
    const host = new Host()
    container.append(producer, host)
    const { mutation } = producer
    const { isMutating } = host

    await vi.advanceTimersByTimeAsync(0)
    mutation.mutate(1)
    expect(isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(0)
    expect(host.shadowRoot).toHaveTextContent('mutating: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutating()).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('mutating: 0')
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

      readonly isMutating = useIsMutating(this, {}, queryClient)

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

  it('should count all mutating mutations when filters are omitted', async () => {
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
      readonly isMutating = useIsMutating(this)

      override render() {
        return html`<p>mutating: ${this.isMutating()}</p>`
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

    expect(host.shadowRoot).toHaveTextContent('mutating: 0')
    producer.mutation1.mutate()
    producer.mutation2.mutate()
    await vi.advanceTimersByTimeAsync(0)
    expect(host.shadowRoot).toHaveTextContent('mutating: 2')
    await vi.advanceTimersByTimeAsync(10)
    expect(host.shadowRoot).toHaveTextContent('mutating: 0')
  })

  it('should be able to filter', async () => {
    const mutationKey1 = queryKey()
    const mutationKey2 = queryKey()

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
        { mutationKey: mutationKey1 },
        queryClient,
      )

      override render() {
        const all = this.isMutatingAll()
        const filtered = this.isMutatingFiltered()
        return html`<p>all: ${all}, filtered: ${filtered}</p>`
      }
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
    expect(host.shadowRoot).toHaveTextContent('all: 2, filtered: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutatingAll()).toBe(1)
    expect(isMutatingFiltered()).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('all: 1, filtered: 0')
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutatingAll()).toBe(0)
    expect(isMutatingFiltered()).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('all: 0, filtered: 0')
  })

  it('should apply updated filters on host updates', async () => {
    const mutationKey1 = queryKey()
    const mutationKey2 = queryKey()
    const unmatchedMutationKey = queryKey()
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

      readonly isMutatingFiltered = useIsMutating(
        this,
        () => activeFilter,
        queryClient,
      )

      override render() {
        return html`<p>filtered: ${this.isMutatingFiltered()}</p>`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const { mutationA, mutationB, isMutatingFiltered } = host

    mutationA.mutate()
    mutationB.mutate()
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutatingFiltered()).toBe(1)
    expect(host.shadowRoot).toHaveTextContent('filtered: 1')

    activeFilter = { mutationKey: unmatchedMutationKey }
    host.requestUpdate()
    await host.updateComplete
    expect(isMutatingFiltered()).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('filtered: 0')

    activeFilter = { mutationKey: mutationKey2 }
    host.requestUpdate()
    await host.updateComplete
    expect(isMutatingFiltered()).toBe(1)
    expect(host.shadowRoot).toHaveTextContent('filtered: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutatingFiltered()).toBe(1)
    expect(host.shadowRoot).toHaveTextContent('filtered: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutatingFiltered()).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('filtered: 0')
  })

  it('should fail after the handshake and recover under a provider', async () => {
    const mutationKey = queryKey()

    class Consumer extends LitElement {
      readonly mutationKey = mutationKey

      readonly isMutating = useIsMutating(this, {
        mutationKey: this.mutationKey,
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.isMutating()).toBe(0)
    container.append(consumer)
    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.isMutating()).toThrow(/No QueryClient available/)

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)
    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    expect(consumer.isMutating()).toBe(0)

    consumer.isMutating.destroy()
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
    expect(queryClient.isMutating()).toBe(1)

    class Host extends LitElement {
      isMutating?: IsMutatingAccessor
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    await host.updateComplete

    // Lit calls hostConnected immediately when a controller is added to an
    // already-connected host
    host.isMutating = useIsMutating(host, {}, queryClient)
    const { isMutating } = host
    expect(isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(isMutating()).toBe(0)

    isMutating.destroy()
    producerMutation.destroy()
  })
})
