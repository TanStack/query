import { LitElement, html } from 'lit'
import {
  createMutationController,
  createQueryController,
} from '@tanstack/lit-query'
import { todosMutations, todosQueries } from './services/todos/queries'

class TodoListUI extends LitElement {
  static properties = {
    inputValue: { state: true },
  }

  private inputValue = ''

  private readonly todos = createQueryController(this, todosQueries.list())

  private readonly addTodoMutation = createMutationController(this, () => ({
    ...todosMutations.create(),
    onSettled: (_data, _error, _variables, _onMutateResult, { client }) =>
      client.invalidateQueries({ queryKey: todosQueries.list().queryKey }),
  }))

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    const text = this.inputValue.trim()
    if (!text) return
    this.addTodoMutation.mutate(text)
    this.inputValue = ''
  }

  render() {
    const { status, data: todos, error } = this.todos()
    const addTodoMutation = this.addTodoMutation()

    if (status === 'pending') return html`<p>Loading todos…</p>`
    if (status === 'error') return html`<p>Error: ${error.message}</p>`

    return html`
      <div>
        <p style="font-size: 0.875rem; color: #555; margin-bottom: 1rem">
          <strong>Approach 1 — via UI variables:</strong> The pending item is
          rendered directly from <code>mutation.variables</code>. No cache
          manipulation needed. On error the pending item simply disappears.
        </p>

        <form
          @submit=${this.handleSubmit}
          style="display: flex; gap: 8px; margin-bottom: 1rem"
        >
          <input
            .value=${this.inputValue}
            @input=${(event: Event) =>
              (this.inputValue = (
                event.currentTarget as HTMLInputElement
              ).value)}
            placeholder="New todo…"
            style="flex: 1; padding: 0.4rem 0.6rem; font-size: 1rem"
          />
          <button type="submit" ?disabled=${addTodoMutation.isPending}>
            Add
          </button>
        </form>

        ${
          addTodoMutation.isError
            ? html`<p style="color: red; margin-bottom: 0.5rem">
                ${addTodoMutation.error.message}
              </p>`
            : null
        }

        <ul style="list-style: none; padding: 0">
          ${todos.map(
            (todo) => html`
              <li style="padding: 0.4rem 0; border-bottom: 1px solid #eee">
                ${todo.text}
              </li>
            `,
          )}
          ${
            addTodoMutation.isPending
              ? html`
                  <li
                    style="padding: 0.4rem 0; border-bottom: 1px solid #eee; opacity: 0.5"
                  >
                    ${addTodoMutation.variables} <em>(saving…)</em>
                  </li>
                `
              : null
          }
        </ul>
      </div>
    `
  }
}

customElements.define('todo-list-ui', TodoListUI)
