import { createQueryController, isFetching } from '@tanstack/lit-query'
import { LitElement, html } from 'lit'
import { todosQueries } from './services/todos/queries'

class TodoList extends LitElement {
  static properties = {
    initialFilter: { attribute: false },
    filter: { state: true },
  }

  initialFilter = ''
  private filter: string | undefined

  private readonly todos = createQueryController(this, () =>
    todosQueries.list(this.filter ?? this.initialFilter),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private setEditingIndex(editingIndex: number | null) {
    this.dispatchEvent(
      new CustomEvent('set-editing-index', { detail: editingIndex }),
    )
  }

  render() {
    const queryResult = this.todos()

    return html`
      <div>
        <div>
          <label>
            Filter:
            <input
              .value=${this.filter ?? this.initialFilter}
              @input=${(event: Event) =>
                (this.filter = (event.currentTarget as HTMLInputElement).value)}
            />
          </label>
        </div>
        ${
          queryResult.status === 'pending'
            ? html`<span
                >Loading... (Attempt: ${queryResult.failureCount + 1})</span
              >`
            : queryResult.status === 'error'
              ? html`
                  <span>
                    Error: ${queryResult.error.message}
                    <br />
                    <button type="button" @click=${() => queryResult.refetch()}>
                      Retry
                    </button>
                  </span>
                `
              : html`
                  <ul>
                    ${queryResult.data.map(
                      (todo) => html`
                        <li>
                          ${todo.name}
                          <button
                            type="button"
                            @click=${() => this.setEditingIndex(todo.id)}
                          >
                            Edit
                          </button>
                        </li>
                      `,
                    )}
                  </ul>
                  <div>
                    ${
                      isFetching(queryResult)
                        ? html`<span>
                            Background Refreshing... (Attempt:
                            ${queryResult.failureCount + 1})
                          </span>`
                        : html`<span>&nbsp;</span>`
                    }
                  </div>
                `
        }
      </div>
    `
  }
}

customElements.define('todo-list', TodoList)
