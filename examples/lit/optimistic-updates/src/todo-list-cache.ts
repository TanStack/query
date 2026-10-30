import { LitElement, html } from 'lit'
import {
  createMutationController,
  createQueryController,
} from '@tanstack/lit-query'
import { todosMutations, todosQueries } from './services/todos/queries'
import type { Todo } from './services/todos/types'

interface MutationContext {
  previousTodos: Array<Todo> | undefined
  optimisticId: string
}

class TodoListCache extends LitElement {
  static properties = {
    inputValue: { state: true },
    lastError: { state: true },
  }

  private inputValue = ''
  private lastError: string | null = null

  private readonly todos = createQueryController(this, todosQueries.list())

  private readonly addTodoMutation = createMutationController<
    Todo,
    Error,
    string,
    MutationContext
  >(this, () => ({
    ...todosMutations.create(),
    onMutate: async (text, { client }) => {
      this.lastError = null
      await client.cancelQueries({
        queryKey: todosQueries.list().queryKey,
      })

      const previousTodos = client.getQueryData(todosQueries.list().queryKey)

      const optimisticId = `optimistic-${Date.now()}`
      const optimisticTodo: Todo = {
        id: optimisticId,
        text,
        createdAt: Date.now(),
      }

      client.setQueryData(todosQueries.list().queryKey, (old = []) => [
        ...old,
        optimisticTodo,
      ])

      return { previousTodos, optimisticId }
    },
    onError: (_err, _text, context, { client }) => {
      this.lastError = _err.message
      if (context?.previousTodos !== undefined) {
        client.setQueryData(todosQueries.list().queryKey, context.previousTodos)
      } else if (context?.optimisticId) {
        client.setQueryData(todosQueries.list().queryKey, (old = []) =>
          old.filter((todo) => todo.id !== context.optimisticId),
        )
      }
    },
    onSettled: (_data, _error, _variables, _context, { client }) =>
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
          <strong>Approach 2 — via cache manipulation:</strong>
          <code>onMutate</code> snapshots the cache and writes the optimistic
          item in. <code>onError</code> restores the snapshot on failure.
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
          this.lastError
            ? html`<p style="color: red; margin-bottom: 0.5rem">
                ${this.lastError}
              </p>`
            : null
        }

        <ul style="list-style: none; padding: 0">
          ${todos.map(
            (todo) => html`
              <li
                style="padding: 0.4rem 0; border-bottom: 1px solid #eee; opacity: ${
                  todo.id.startsWith('optimistic-') ? 0.5 : 1
                }"
              >
                ${todo.text}
                ${
                  todo.id.startsWith('optimistic-')
                    ? html`<em> (saving…)</em>`
                    : null
                }
              </li>
            `,
          )}
        </ul>
      </div>
    `
  }
}

customElements.define('todo-list-cache', TodoListCache)
