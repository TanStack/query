import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createQueryController } from '../createQueryController.js'
import { useIsFetching } from '../useIsFetching.js'
import { generateElementName } from './utils.js'
import type { IsFetchingAccessor } from '../useIsFetching.js'

const providerTagName = generateElementName()
customElements.define(providerTagName, QueryClientProvider)

describe('useIsFetching', () => {
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
    const key = queryKey()

    class Consumer extends LitElement {
      readonly queryKey = key

      readonly query = createQueryController(this, {
        queryKey: this.queryKey,
        queryFn: () => sleep(10).then(() => 'query-ok'),
        retry: false,
      })

      readonly isFetching = useIsFetching(this, { queryKey: this.queryKey })

      override render() {
        return html`<p>fetching: ${this.isFetching()}</p>`
      }
    }

    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.query().status).toBe('pending')
    expect(consumer.isFetching()).toBe(0)

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)
    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    expect(consumer.isFetching()).toBe(1)
    await vi.advanceTimersByTimeAsync(0)
    expect(consumer.shadowRoot).toHaveTextContent('fetching: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.isFetching()).toBe(0)
    expect(consumer.shadowRoot).toHaveTextContent('fetching: 0')

    consumer.query.destroy()
    consumer.isFetching.destroy()
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
      readonly queryKey = key

      readonly query = createQueryController(
        this,
        {
          queryKey: this.queryKey,
          queryFn: () => sleep(10).then(() => 'query-ok'),
          retry: false,
        },
        queryClient,
      )

      readonly isFetching = useIsFetching(
        this,
        { queryKey: this.queryKey },
        queryClient,
      )

      override render() {
        return html`<p>fetching: ${this.isFetching()}</p>`
      }
    }

    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)
    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete

    expect(consumer.isFetching()).toBe(1)
    await vi.advanceTimersByTimeAsync(0)
    expect(consumer.shadowRoot).toHaveTextContent('fetching: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(consumer.query().isSuccess).toBe(true)
    expect(consumer.shadowRoot).toHaveTextContent('fetching: 0')
    expect(
      queryClient.getQueryCache().find({ queryKey: consumer.queryKey })?.state
        .data,
    ).toBe('query-ok')
    expect(
      providerClient.getQueryCache().find({ queryKey: consumer.queryKey }),
    ).toBeUndefined()

    consumer.query.destroy()
    consumer.isFetching.destroy()
    provider.remove()
  })

  it('should track the fetching count', async () => {
    const key = queryKey()

    class Producer extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'done'),
        },
        queryClient,
      )
    }

    customElements.define(generateElementName(), Producer)

    class Host extends LitElement {
      readonly isFetching = useIsFetching(this, {}, queryClient)

      override render() {
        return html`<p>fetching: ${this.isFetching()}</p>`
      }
    }

    customElements.define(generateElementName(), Host)
    const producer = new Producer()
    const host = new Host()
    container.append(producer, host)
    const { query } = producer
    const { isFetching } = host

    await vi.advanceTimersByTimeAsync(0)
    expect(isFetching()).toBe(1)
    expect(host.shadowRoot).toHaveTextContent('fetching: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(isFetching()).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('fetching: 0')
  })

  it('should not process query cache updates while disconnected', async () => {
    const key = queryKey()

    class Producer extends LitElement {
      readonly query = createQueryController(
        this,
        {
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        },
        queryClient,
      )
    }

    customElements.define(generateElementName(), Producer)

    class Host extends LitElement {
      updatesRequested = 0

      readonly isFetching = useIsFetching(this, {}, queryClient)

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
    container.append(new Producer())
    await vi.advanceTimersByTimeAsync(10)
    expect(host.updatesRequested).toBe(updatesAfterDisconnect)
  })

  it('should count all fetching queries when filters are omitted', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    class Producer extends LitElement {
      readonly query1 = createQueryController(this, {
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 'data1'),
      })

      readonly query2 = createQueryController(this, {
        queryKey: key2,
        queryFn: () => sleep(10).then(() => 'data2'),
      })
    }

    customElements.define(generateElementName(), Producer)

    class Host extends LitElement {
      readonly isFetching = useIsFetching(this)

      override render() {
        return html`<p>fetching: ${this.isFetching()}</p>`
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

    await vi.advanceTimersByTimeAsync(0)
    expect(host.shadowRoot).toHaveTextContent('fetching: 2')
    await vi.advanceTimersByTimeAsync(10)
    expect(host.shadowRoot).toHaveTextContent('fetching: 0')
  })

  it('should be able to filter', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

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
        { queryKey: key1 },
        queryClient,
      )

      override render() {
        const all = this.isFetchingAll()
        const filtered = this.isFetchingFiltered()
        return html`<p>all: ${all}, filtered: ${filtered}</p>`
      }
    }

    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const { isFetchingAll, isFetchingFiltered } = host

    await vi.advanceTimersByTimeAsync(0)
    expect(isFetchingAll()).toBe(2)
    expect(isFetchingFiltered()).toBe(1)
    expect(host.shadowRoot).toHaveTextContent('all: 2, filtered: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(isFetchingAll()).toBe(1)
    expect(isFetchingFiltered()).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('all: 1, filtered: 0')
    await vi.advanceTimersByTimeAsync(10)
    expect(isFetchingAll()).toBe(0)
    expect(isFetchingFiltered()).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('all: 0, filtered: 0')
  })

  it('should apply updated filters on host updates', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const unmatchedKey = queryKey()
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

      readonly isFetchingFiltered = useIsFetching(
        this,
        () => activeFilter,
        queryClient,
      )

      override render() {
        return html`<p>filtered: ${this.isFetchingFiltered()}</p>`
      }
    }

    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const { isFetchingFiltered } = host

    await vi.advanceTimersByTimeAsync(0)
    expect(isFetchingFiltered()).toBe(1)
    expect(host.shadowRoot).toHaveTextContent('filtered: 1')

    activeFilter = { queryKey: unmatchedKey }
    host.requestUpdate()
    await host.updateComplete
    expect(isFetchingFiltered()).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('filtered: 0')

    activeFilter = { queryKey: key2 }
    host.requestUpdate()
    await host.updateComplete
    expect(isFetchingFiltered()).toBe(1)
    expect(host.shadowRoot).toHaveTextContent('filtered: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(isFetchingFiltered()).toBe(1)
    expect(host.shadowRoot).toHaveTextContent('filtered: 1')
    await vi.advanceTimersByTimeAsync(10)
    expect(isFetchingFiltered()).toBe(0)
    expect(host.shadowRoot).toHaveTextContent('filtered: 0')
  })

  it('should fail after the handshake and recover under a provider', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly queryKey = key

      readonly query = createQueryController(this, {
        queryKey: this.queryKey,
        queryFn: () => sleep(10).then(() => 'query-ok'),
        retry: false,
      })

      readonly isFetching = useIsFetching(this, { queryKey: this.queryKey })
    }

    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.query().status).toBe('pending')
    expect(consumer.isFetching()).toBe(0)

    container.append(consumer)
    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.query()).toThrow(/No QueryClient available/)
    expect(() => consumer.isFetching()).toThrow(/No QueryClient available/)

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

    consumer.query.destroy()
    consumer.isFetching.destroy()
    provider.remove()
  })

  it('should not throw on an already-connected host with an explicit client', async () => {
    const key = queryKey()

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
    }

    customElements.define(generateElementName(), Producer)
    const producer = new Producer()
    container.append(producer)

    await vi.advanceTimersByTimeAsync(0)
    expect(queryClient.isFetching()).toBe(1)

    class Host extends LitElement {
      isFetching?: IsFetchingAccessor
    }

    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    await host.updateComplete

    // Lit calls hostConnected immediately when a controller is added to an
    // already-connected host
    host.isFetching = useIsFetching(host, {}, queryClient)
    const { isFetching } = host
    expect(isFetching()).toBe(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(isFetching()).toBe(0)

    isFetching.destroy()
  })
})
