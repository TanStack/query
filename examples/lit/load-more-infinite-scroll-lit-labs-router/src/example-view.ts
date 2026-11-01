import { LitElement, html } from 'lit'
import { ref } from 'lit/directives/ref.js'
import { createInfiniteQueryController } from '@tanstack/lit-query'
import { projectsQueries } from './services/projects/queries'

class ExampleView extends LitElement {
  static properties = {
    inView: { state: true },
  }

  private inView = false
  private observer: IntersectionObserver | undefined

  private readonly projects = createInfiniteQueryController(
    this,
    projectsQueries.infinite(),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.observer?.disconnect()
  }

  protected override updated() {
    const { hasNextPage, isFetchingNextPage } = this.projects()

    if (this.inView && hasNextPage && !isFetchingNextPage) {
      this.projects.fetchNextPage()
    }
  }

  private observeLoadMoreButton = (element?: Element) => {
    this.observer?.disconnect()

    if (!element) return

    this.observer = new IntersectionObserver(([entry]) => {
      this.inView = entry.isIntersecting
    })
    this.observer.observe(element)
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
              style="border: 1px solid gray; border-radius: 5px; padding: 10rem 1rem; background: hsla(${
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
          ${ref(this.observeLoadMoreButton)}
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
        <h1>Infinite Loading</h1>
        ${this.renderProjects()}
        <hr />
        <a href="/about">Go to another page</a>
      </div>
    `
  }
}

customElements.define('example-view', ExampleView)
