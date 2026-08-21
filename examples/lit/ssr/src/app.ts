import { LitElement, css, html } from 'lit'
import {
  createQueryController,
  type QueryClient,
  type QueryResultAccessor,
} from '@tanstack/lit-query'
import { createDataQueryOptions, type DataResponse } from './api.js'

const ssrQueryControllerCreationCounts = new WeakMap<QueryClient, number>()

function incrementSsrQueryControllerCreationCount(
  queryClient: QueryClient,
): void {
  ssrQueryControllerCreationCounts.set(
    queryClient,
    (ssrQueryControllerCreationCounts.get(queryClient) ?? 0) + 1,
  )
}

export function resetSsrQueryControllerCreationCount(
  queryClient: QueryClient,
): void {
  ssrQueryControllerCreationCounts.set(queryClient, 0)
}

export function getSsrQueryControllerCreationCount(
  queryClient: QueryClient,
): number {
  return ssrQueryControllerCreationCounts.get(queryClient) ?? 0
}

export class SsrApp extends LitElement {
  static properties = {
    apiBaseUrl: { attribute: 'api-base-url' },
    queryClient: { attribute: false },
  }

  static styles = css`
    :host {
      color: #1f2937;
      display: block;
      font-family:
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        sans-serif;
      max-width: 32rem;
      padding: 1.5rem;
    }

    article {
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 1rem;
      box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
      padding: 1.25rem;
    }

    h1 {
      font-size: 1.25rem;
      margin: 0 0 1rem;
    }

    p {
      margin: 0.5rem 0;
    }

    button {
      background: #111827;
      border: none;
      border-radius: 999px;
      color: #ffffff;
      cursor: pointer;
      font: inherit;
      margin-top: 1rem;
      padding: 0.65rem 1rem;
    }

    button[disabled] {
      cursor: wait;
      opacity: 0.65;
    }
  `

  apiBaseUrl = ''
  queryClient?: QueryClient

  private dataQuery?: QueryResultAccessor<DataResponse, Error>

  protected override willUpdate(): void {
    if (!this.dataQuery && this.queryClient) {
      incrementSsrQueryControllerCreationCount(this.queryClient)
      this.dataQuery = createQueryController(
        this,
        createDataQueryOptions(this.apiBaseUrl),
        this.queryClient,
      )
    }
  }

  private readonly handleRefetch = (): void => {
    void this.dataQuery?.refetch()
  }

  protected override render() {
    if (!this.dataQuery) {
      return html`
        <article data-testid="content">
          <h1>Lit Query SSR</h1>
          <p data-testid="status">Loading...</p>
        </article>
      `
    }

    const query = this.dataQuery()

    if (query.isPending) {
      return html`
        <article data-testid="content">
          <h1>Lit Query SSR</h1>
          <p data-testid="status">Loading...</p>
        </article>
      `
    }

    if (query.isError) {
      return html`
        <article data-testid="content">
          <h1>Lit Query SSR</h1>
          <p data-testid="status">Error</p>
          <p data-testid="error-message">${query.error?.message}</p>
        </article>
      `
    }

    return html`
      <article data-testid="content">
        <h1>Lit Query SSR</h1>
        <p data-testid="status">${query.isFetching ? 'Refreshing' : 'Ready'}</p>
        <p data-testid="message">${query.data.message}</p>
        <p data-testid="request-count">
          Request count: ${query.data.requestCount}
        </p>
        <p data-testid="served-at">Served at: ${query.data.servedAt}</p>
        <button
          data-testid="refetch-button"
          ?disabled=${query.isFetching}
          @click=${this.handleRefetch}
        >
          Refetch
        </button>
      </article>
    `
  }
}

if (!customElements.get('ssr-app')) {
  customElements.define('ssr-app', SsrApp)
}

declare global {
  interface HTMLElementTagNameMap {
    'ssr-app': SsrApp
  }
}
