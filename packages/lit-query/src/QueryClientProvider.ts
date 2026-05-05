import { ContextProvider } from '@lit/context'
import type { QueryClient } from '@tanstack/query-core'
import type { TemplateResult } from 'lit'
import { LitElement, html } from 'lit'
import {
  createMissingQueryClientError,
  queryClientContext,
  registerDefaultQueryClient,
  unregisterDefaultQueryClient,
} from './context.js'

export class QueryClientProvider extends LitElement {
  static properties = {
    client: { attribute: false },
  }

  declare client: QueryClient

  private readonly contextProvider: ContextProvider<typeof queryClientContext>

  private mountedClient: QueryClient | undefined

  constructor() {
    super()
    this.contextProvider = new ContextProvider(this, {
      context: queryClientContext,
    })
  }

  connectedCallback(): void {
    super.connectedCallback()
    const client = this.requireClient()
    this.contextProvider.setValue(client)
    this.mountClient(client)
  }

  disconnectedCallback(): void {
    this.unmountClient(this.mountedClient)
    super.disconnectedCallback()
  }

  protected willUpdate(changedProperties: Map<PropertyKey, unknown>): void {
    if (!changedProperties.has('client')) {
      return
    }

    const nextClient = this.client
    if (!nextClient) {
      if (this.isConnected) {
        this.unmountClient(this.mountedClient)
        // Sentinel: notify active consumers that the provider is now unbound.
        this.contextProvider.setValue(undefined as unknown as QueryClient)
        throw createMissingQueryClientError()
      }

      return
    }

    const previousClient = changedProperties.get('client') as
      | QueryClient
      | undefined
    if (previousClient && previousClient !== nextClient && this.isConnected) {
      this.unmountClient(previousClient)
    }

    this.contextProvider.setValue(nextClient)

    if (this.isConnected) {
      this.mountClient(nextClient)
    }
  }

  render(): TemplateResult {
    return html`<slot></slot>`
  }

  private mountClient(client: QueryClient): void {
    if (this.mountedClient === client) {
      return
    }

    if (this.mountedClient) {
      this.unmountClient(this.mountedClient)
    }

    client.mount()
    registerDefaultQueryClient(client)
    this.mountedClient = client
  }

  private unmountClient(client?: QueryClient): void {
    if (!client) {
      return
    }

    client.unmount()
    unregisterDefaultQueryClient(client)

    if (this.mountedClient === client) {
      this.mountedClient = undefined
    }
  }

  private requireClient(): QueryClient {
    if (!this.client) {
      throw createMissingQueryClientError()
    }

    return this.client
  }
}
