import { html, LitElement } from 'lit'
import { QueryClient } from '@tanstack/query-core'
import {
  QueryClientProvider,
  createMutationController,
  createQueryController,
  useIsFetching,
  useIsMutating,
} from '@tanstack/lit-query'
import {
  addTodoOnServer,
  failNextFetchRequest,
  failNextMutationRequest,
  fetchTodosFromServer,
  resetTodoApi,
  type Todo,
  type TodosResponse,
} from './todoApi'

resetTodoApi()

const demoQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

class DemoQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = demoQueryClient
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }
}

customElements.define('demo-query-provider', DemoQueryProvider)

class TanstackLitQueryDemo extends LitElement {
  static properties = {
    nextTodoTitle: { state: true },
    cacheSeedCount: { state: true },
  }

  private nextTodoTitle = 'Add mutation assertion'
  private cacheSeedCount = 0

  private readonly todosQuery = createQueryController<TodosResponse, Error>(
    this,
    {
      queryKey: ['todos'],
      queryFn: fetchTodosFromServer,
    },
  )

  private readonly createTodoMutation = createMutationController<
    Todo,
    Error,
    string
  >(this, {
    mutationKey: ['create-todo'],
    mutationFn: addTodoOnServer,
    onSuccess: (createdTodo) => {
      demoQueryClient.setQueryData<TodosResponse>(['todos'], (existing) => {
        if (!existing) {
          return {
            items: [createdTodo],
            requestCount: 0,
            source: 'cache',
          }
        }

        return {
          items: [...existing.items, createdTodo],
          requestCount: existing.requestCount,
          source: 'cache',
        }
      })
    },
  })

  private readonly isFetching = useIsFetching(this, {
    queryKey: ['todos'],
  })

  private readonly isMutating = useIsMutating(this, {
    mutationKey: ['create-todo'],
  })

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private onTitleInput(event: Event): void {
    const target = event.target as HTMLInputElement
    this.nextTodoTitle = target.value
  }

  private addTodo(): void {
    const title = this.nextTodoTitle.trim()
    if (!title) {
      return
    }

    this.createTodoMutation.mutate(title)
    this.nextTodoTitle = ''
  }

  private async invalidateTodos(): Promise<void> {
    await demoQueryClient.invalidateQueries({ queryKey: ['todos'] })
  }

  private seedCacheOnlyTodo(): void {
    this.cacheSeedCount += 1

    const seedTodo: Todo = {
      id: 10_000 + this.cacheSeedCount,
      title: `Seeded cache todo ${this.cacheSeedCount}`,
    }

    demoQueryClient.setQueryData<TodosResponse>(['todos'], (existing) => {
      if (!existing) {
        return {
          items: [seedTodo],
          requestCount: 0,
          source: 'cache',
        }
      }

      return {
        items: [...existing.items, seedTodo],
        requestCount: existing.requestCount,
        source: 'cache',
      }
    })
  }

  private forceNextFetchFailure(): void {
    failNextFetchRequest()
  }

  private forceNextMutationFailure(): void {
    failNextMutationRequest()
  }

  private async resetDemoState(): Promise<void> {
    resetTodoApi()
    this.cacheSeedCount = 0
    this.nextTodoTitle = 'Add mutation assertion'

    await demoQueryClient.resetQueries({ queryKey: ['todos'] })
    this.createTodoMutation.reset()
  }

  render() {
    const query = this.todosQuery()
    const mutation = this.createTodoMutation()
    const todos = query.data?.items ?? []

    return html`
      <main>
        <h1>TanStack Lit Query E2E Demo</h1>
        <p>Verifies integration between Lit, query-core, and this adapter.</p>

        <section>
          <div data-testid="query-status">query: ${query.status}</div>
          <div data-testid="mutation-status">mutation: ${mutation.status}</div>
          <div data-testid="active-fetches">fetches: ${this.isFetching()}</div>
          <div data-testid="active-mutations">
            mutations: ${this.isMutating()}
          </div>
          <div data-testid="request-count">
            server-requests: ${query.data?.requestCount ?? 0}
          </div>
          <div data-testid="data-source">
            source: ${query.data?.source ?? 'none'}
          </div>
        </section>

        <section>
          <button
            data-testid="refetch"
            @click=${() => this.todosQuery.refetch()}
          >
            Refetch
          </button>
          <button
            data-testid="invalidate"
            @click=${() => this.invalidateTodos()}
          >
            Invalidate
          </button>
          <button
            data-testid="seed-cache"
            @click=${() => this.seedCacheOnlyTodo()}
          >
            Seed Cache
          </button>
          <button
            data-testid="reset-demo-state"
            @click=${() => this.resetDemoState()}
          >
            Reset Demo State
          </button>
          <button
            data-testid="fail-next-fetch"
            @click=${() => this.forceNextFetchFailure()}
          >
            Fail Next Fetch
          </button>
          <button
            data-testid="fail-next-mutation"
            @click=${() => this.forceNextMutationFailure()}
          >
            Fail Next Mutation
          </button>
        </section>

        <section>
          <label for="newTodoInput">New todo</label>
          <input
            id="newTodoInput"
            data-testid="new-todo-input"
            .value=${this.nextTodoTitle}
            @input=${this.onTitleInput}
          />
          <button data-testid="add-todo" @click=${() => this.addTodo()}>
            Add Todo (Mutation)
          </button>
        </section>

        ${query.isError
          ? html`<div data-testid="query-error">${String(query.error)}</div>`
          : null}
        ${mutation.isError
          ? html`<div data-testid="mutation-error">
              ${String(mutation.error)}
            </div>`
          : null}

        <ul data-testid="todo-list">
          ${todos.map(
            (todo) =>
              html`<li data-testid="todo-item">${todo.id}: ${todo.title}</li>`,
          )}
        </ul>
      </main>
    `
  }
}

customElements.define('tanstack-lit-query-demo', TanstackLitQueryDemo)

class DemoRoot extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <demo-query-provider>
        <tanstack-lit-query-demo></tanstack-lit-query-demo>
      </demo-query-provider>
    `
  }
}

customElements.define('demo-root', DemoRoot)
