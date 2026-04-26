import { html, LitElement } from 'lit'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider, createQueryController } from '@tanstack/lit-query'
import {
  fetchTodosFromServer,
  resetTodoApi,
  type TodosResponse,
} from './todoApi'

resetTodoApi()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

class BasicQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }
}

customElements.define('basic-query-provider', BasicQueryProvider)

class BasicQueryExample extends LitElement {
  private readonly todos = createQueryController<TodosResponse, Error>(this, {
    queryKey: ['todos'],
    queryFn: fetchTodosFromServer,
  })

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const query = this.todos()
    return html`
      <main>
        <h1>Basic Query Example</h1>
        <p data-testid="basic-query-status">
          Status: <strong>${query.status}</strong>
        </p>
        <button
          data-testid="basic-refetch"
          @click=${() => this.todos.refetch()}
        >
          Refetch
        </button>

        ${query.isPending
          ? html`<p data-testid="basic-loading">Loading...</p>`
          : null}
        ${query.isError
          ? html`<p data-testid="basic-error">Error: ${String(query.error)}</p>`
          : null}

        <ul data-testid="basic-todo-list">
          ${(query.data?.items ?? []).map(
            (todo) =>
              html`<li data-testid="basic-todo-item">${todo.title}</li>`,
          )}
        </ul>
      </main>
    `
  }
}

customElements.define('basic-query-example', BasicQueryExample)

class BasicQueryRoot extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <basic-query-provider>
        <basic-query-example></basic-query-example>
      </basic-query-provider>
    `
  }
}

customElements.define('basic-query-root', BasicQueryRoot)
