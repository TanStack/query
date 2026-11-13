import { LitElement, html } from 'lit'
import {
  QueryClient,
  QueryClientProvider,
  createQueryController,
  keepPreviousData,
  noop,
} from '@tanstack/lit-query'
import { worker } from './mocks'
import { projectsQueries } from './services/projects/queries'

const queryClient = new QueryClient()

class PaginationQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class PaginationExample extends LitElement {
  static properties = {
    page: { state: true },
  }

  private page = 0

  private readonly projects = createQueryController(this, () => ({
    ...projectsQueries.list(this.page),
    placeholderData: keepPreviousData,
  }))

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  protected override updated() {
    const { data, isPlaceholderData } = this.projects()

    // Prefetch the next page!
    if (!isPlaceholderData && data?.hasMore) {
      queryClient.query(projectsQueries.list(this.page + 1)).catch(noop)
    }
  }

  render() {
    const { status, data, error, isFetching, isPlaceholderData } =
      this.projects()

    return html`
      <div>
        <p>
          In this example, each page of data remains visible as the next page is
          fetched. The buttons and capability to proceed to the next page are
          also suppressed until the next page cursor is known. Each page is
          cached as a normal query too, so when going to previous pages, you'll
          see them instantaneously while they are also refetched invisibly in
          the background.
        </p>
        ${
          status === 'pending'
            ? html`<div>Loading...</div>`
            : status === 'error'
              ? html`<div>Error: ${error.message}</div>`
              : html`
                  <div>
                    ${data.projects.map(
                      (project) => html`<p>${project.name}</p>`,
                    )}
                  </div>
                `
        }
        <div>Current Page: ${this.page + 1}</div>
        <button
          type="button"
          @click=${() => {
            this.page = Math.max(this.page - 1, 0)
          }}
          ?disabled=${this.page === 0}
        >
          Previous Page
        </button>
        <button
          type="button"
          @click=${() => {
            if (data?.hasMore) this.page += 1
          }}
          ?disabled=${isPlaceholderData || !data?.hasMore}
        >
          Next Page
        </button>
        ${isFetching ? html`<span> Loading...</span>` : null}
      </div>
    `
  }
}

class PaginationApp extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <pagination-query-provider>
        <pagination-example></pagination-example>
      </pagination-query-provider>
    `
  }
}

customElements.define('pagination-query-provider', PaginationQueryProvider)
customElements.define('pagination-example', PaginationExample)

worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
  customElements.define('pagination-app', PaginationApp)
})
