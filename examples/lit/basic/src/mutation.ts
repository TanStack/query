import { LitElement, html } from 'lit'
import {
  QueryClient,
  QueryClientProvider,
  createMutationController,
  createQueryController,
} from '@tanstack/lit-query'
import { resetTodoApi } from './services/todos/api'
import { todosMutations, todosQueries } from './services/todos/queries'
import type { TodosResponse } from './services/todos/types'

resetTodoApi()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

class MutationExampleProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }
}

customElements.define('mutation-example-provider', MutationExampleProvider)

class MutationExample extends LitElement {
  static properties = {
    nextTitle: { state: true },
  }

  private nextTitle = 'Created from mutation example'

  private readonly todos = createQueryController(this, todosQueries.list())

  private readonly addTodo = createMutationController(this, {
    ...todosMutations.create(),
    onSuccess: (created) => {
      queryClient.setQueryData<TodosResponse>(
        todosQueries.list().queryKey,
        (existing) => {
          if (!existing) {
            return {
              items: [created],
              requestCount: 0,
              source: 'cache',
            }
          }

          return {
            items: [...existing.items, created],
            requestCount: existing.requestCount,
            source: 'cache',
          }
        },
      )
    },
  })

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private onInput(event: Event): void {
    const target = event.target as HTMLInputElement
    this.nextTitle = target.value
  }

  private submit(): void {
    const title = this.nextTitle.trim()
    if (!title) return
    this.addTodo.mutate(title)
    this.nextTitle = ''
  }

  render() {
    const query = this.todos()
    const mutation = this.addTodo()
    const items = query.data?.items ?? []

    return html`
      <main>
        <h1>Mutation Example</h1>
        <p data-testid="mutation-query-status">
          Query: <strong>${query.status}</strong>
        </p>
        <p data-testid="mutation-mutation-status">
          Mutation: <strong>${mutation.status}</strong>
        </p>

        <label for="title">Todo title</label>
        <input
          id="title"
          data-testid="mutation-input"
          .value=${this.nextTitle}
          @input=${this.onInput}
        />
        <button data-testid="mutation-add" @click=${this.submit}>
          Add Todo
        </button>

        <ul data-testid="mutation-todo-list">
          ${items.map(
            (todo) =>
              html`<li data-testid="mutation-todo-item">${todo.title}</li>`,
          )}
        </ul>
      </main>
    `
  }
}

customElements.define('mutation-example', MutationExample)

class MutationExampleRoot extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <mutation-example-provider>
        <mutation-example></mutation-example>
      </mutation-example-provider>
    `
  }
}

customElements.define('mutation-example-root', MutationExampleRoot)
