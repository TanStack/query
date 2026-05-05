import { html, LitElement } from 'lit'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider, createQueryController } from '@tanstack/lit-query'

type ContractProbeData = {
  provider: 'provider-a' | 'provider-b'
  payload: string
}

type ContractTarget = 'orphan' | 'provider-a' | 'provider-b'

const contractQueryKey = ['lifecycle-contract', 'provider-binding'] as const
let contractConsumerInstanceCount = 0

function createContractClient(data: ContractProbeData): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Number.POSITIVE_INFINITY,
      },
    },
  })

  client.setQueryData(contractQueryKey, data)
  return client
}

const contractClientA = createContractClient({
  provider: 'provider-a',
  payload: 'provider-a cache',
})

const contractClientB = createContractClient({
  provider: 'provider-b',
  payload: 'provider-b cache',
})

class ContractProviderA extends QueryClientProvider {
  constructor() {
    super()
    this.client = contractClientA
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }
}

if (!customElements.get('contract-provider-a')) {
  customElements.define('contract-provider-a', ContractProviderA)
}

class ContractProviderB extends QueryClientProvider {
  constructor() {
    super()
    this.client = contractClientB
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }
}

if (!customElements.get('contract-provider-b')) {
  customElements.define('contract-provider-b', ContractProviderB)
}

class LifecycleContractConsumer extends LitElement {
  private readonly instanceId = ++contractConsumerInstanceCount

  private readonly query = createQueryController<ContractProbeData, Error>(
    this,
    {
      queryKey: contractQueryKey,
      queryFn: async () => {
        throw new Error(
          'Lifecycle contract fixture unexpectedly fetched from queryFn.',
        )
      },
      retry: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private renderQueryState() {
    try {
      const query = this.query()

      return html`
        <div data-testid="contract-query-status">query: ${query.status}</div>
        <div data-testid="contract-provider-value">
          provider: ${query.data?.provider ?? 'none'}
        </div>
        <div data-testid="contract-payload">
          payload: ${query.data?.payload ?? 'none'}
        </div>
        <div data-testid="contract-error">
          error: ${query.error ? String(query.error) : 'none'}
        </div>
      `
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      return html`
        <div data-testid="contract-query-status">query: missing-client</div>
        <div data-testid="contract-provider-value">provider: none</div>
        <div data-testid="contract-payload">payload: none</div>
        <div data-testid="contract-error">error: ${message}</div>
      `
    }
  }

  render() {
    return html`
      <div data-testid="contract-instance-id">instance: ${this.instanceId}</div>
      ${this.renderQueryState()}
    `
  }
}

if (!customElements.get('lifecycle-contract-consumer')) {
  customElements.define(
    'lifecycle-contract-consumer',
    LifecycleContractConsumer,
  )
}

class LifecycleContractRoot extends LitElement {
  static properties = {
    currentTarget: { state: true },
  }

  private currentTarget: ContractTarget = 'orphan'

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  override firstUpdated(): void {
    this.moveConsumerTo('orphan')
  }

  moveConsumerTo(target: ContractTarget): void {
    const consumer = this.ensureConsumer()
    const destination = this.getContainer(target)
    destination.appendChild(consumer)
    this.currentTarget = target
    this.requestUpdate()
  }

  private ensureConsumer(): LifecycleContractConsumer {
    const existing = this.querySelector(
      'lifecycle-contract-consumer',
    ) as LifecycleContractConsumer | null
    if (existing) {
      return existing
    }

    return document.createElement(
      'lifecycle-contract-consumer',
    ) as LifecycleContractConsumer
  }

  private getContainer(target: ContractTarget): HTMLElement {
    const selector =
      target === 'orphan'
        ? '[data-contract-slot="orphan"]'
        : target === 'provider-a'
          ? 'contract-provider-a'
          : 'contract-provider-b'

    const container = this.querySelector(selector)
    if (!(container instanceof HTMLElement)) {
      throw new Error(
        `Lifecycle contract container not found for target "${target}".`,
      )
    }

    return container
  }

  render() {
    return html`
      <main>
        <h1>Lifecycle Contract Fixture</h1>
        <p>
          Exercises the same consumer across missing-provider and provider
          reparent flows.
        </p>
        <div data-testid="contract-location">
          location: ${this.currentTarget}
        </div>

        <section>
          <h2>Orphan Zone</h2>
          <div data-contract-slot="orphan"></div>
        </section>

        <section>
          <h2>Provider A</h2>
          <contract-provider-a></contract-provider-a>
        </section>

        <section>
          <h2>Provider B</h2>
          <contract-provider-b></contract-provider-b>
        </section>
      </main>
    `
  }
}

if (!customElements.get('lifecycle-contract-root')) {
  customElements.define('lifecycle-contract-root', LifecycleContractRoot)
}
