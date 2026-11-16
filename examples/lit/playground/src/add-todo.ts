import { LitElement, html } from 'lit'
import { createMutationController } from '@tanstack/lit-query'
import { todosMutations, todosQueries } from './services/todos/queries'

class AddTodo extends LitElement {
  static properties = {
    name: { state: true },
  }

  private name = ''

  private readonly addMutation = createMutationController(this, {
    ...todosMutations.create(),
    onSuccess: (_data, _variables, _onMutateResult, { client }) => {
      client.invalidateQueries({ queryKey: todosQueries.lists() })
    },
  })

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { status, error, mutate } = this.addMutation()

    return html`
      <div>
        <input
          .value=${this.name}
          ?disabled=${status === 'pending'}
          @input=${(event: Event) =>
            (this.name = (event.currentTarget as HTMLInputElement).value)}
        />
        <button
          type="button"
          ?disabled=${status === 'pending' || !this.name}
          @click=${() =>
            mutate({ name: this.name, notes: 'These are some notes' })}
        >
          Add Todo
        </button>
        <div>
          ${
            status === 'pending'
              ? 'Saving...'
              : status === 'error'
                ? error.message
                : status === 'success'
                  ? 'Saved!'
                  : null
          }
        </div>
      </div>
    `
  }
}

customElements.define('add-todo', AddTodo)
