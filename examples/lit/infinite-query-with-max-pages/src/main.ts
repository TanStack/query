import { LitElement, html } from 'lit'
import {
  QueryClient,
  QueryClientProvider,
  createInfiniteQueryController,
} from '@tanstack/lit-query'
import { worker } from './mocks'
import { projectsQueries } from './services/projects/queries'

const queryClient = new QueryClient()

class InfiniteQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class InfiniteQueryExample extends LitElement {
  private readonly projects = createInfiniteQueryController(
    this,
    projectsQueries.infinite(),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private renderProjects() {
    const {
      status,
      data,
      error,
      isFetching,
      isFetchingNextPage,
      isFetchingPreviousPage,
      hasNextPage,
      hasPreviousPage,
    } = this.projects()

    if (status === 'pending') return html`<p>Loading...</p>`
    if (status === 'error') return html`<span>Error: ${error.message}</span>`

    return html`
      <div>
        <button
          type="button"
          @click=${() => this.projects.fetchPreviousPage()}
          ?disabled=${!hasPreviousPage || isFetchingPreviousPage}
        >
          ${
            isFetchingPreviousPage
              ? 'Loading more...'
              : hasPreviousPage
                ? 'Load Older'
                : 'Nothing more to load'
          }
        </button>
      </div>
      ${data.pages.map((page) =>
        page.data.map(
          (project) => html`
            <p
              style="border: 1px solid gray; border-radius: 5px; padding: 8px; font-size: 14px; background: hsla(${
                project.id * 30
              }, 60%, 80%, 1)"
            >
              ${project.name}
            </p>
          `,
        ),
      )}
      <div>
        <button
          type="button"
          @click=${() => this.projects.fetchNextPage()}
          ?disabled=${!hasNextPage || isFetchingNextPage}
        >
          ${
            isFetchingNextPage
              ? 'Loading more...'
              : hasNextPage
                ? 'Load Newer'
                : 'Nothing more to load'
          }
        </button>
      </div>
      <div>
        ${isFetching && !isFetchingNextPage ? 'Background Updating...' : null}
      </div>
    `
  }

  render() {
    return html`
      <div>
        <h1>Infinite Query with max pages</h1>
        <h3>4 projects per page</h3>
        <h3>3 pages max</h3>
        ${this.renderProjects()}
        <hr />
      </div>
    `
  }
}

class InfiniteQueryApp extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <infinite-query-provider>
        <infinite-query-example></infinite-query-example>
      </infinite-query-provider>
    `
  }
}

customElements.define('infinite-query-provider', InfiniteQueryProvider)
customElements.define('infinite-query-example', InfiniteQueryExample)

worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
  customElements.define('infinite-query-app', InfiniteQueryApp)
})
