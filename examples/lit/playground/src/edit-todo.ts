import { LitElement, html } from 'lit'
import {
  createMutationController,
  createQueryController,
} from '@tanstack/lit-query'
import { todosMutations, todosQueries } from './services/todos/queries'
import type { Todo } from './services/todos/types'

class EditTodo extends LitElement {
  static properties = {
    editingIndex: { attribute: false },
    draft: { state: true },
  }

  editingIndex = 0
  private draft: Partial<Omit<Todo, 'id'>> = {}

  private readonly todo = createQueryController(this, () =>
    todosQueries.detail(this.editingIndex),
  )

  private readonly saveMutation = createMutationController(this, {
    ...todosMutations.update(),
    onSuccess: (todo, _variables, _onMutateResult, { client }) => {
      // Update `todos` and the individual todo queries when this mutation succeeds
      client.invalidateQueries({ queryKey: todosQueries.lists() })
      client.setQueryData(todosQueries.detail(this.editingIndex).queryKey, todo)
      this.draft = {}
    },
  })

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private setEditingIndex(editingIndex: number | null) {
    this.dispatchEvent(
      new CustomEvent('set-editing-index', { detail: editingIndex }),
    )
  }

  render() {
    const { status, data, isFetching, failureCount, refetch } = this.todo()
    const {
      status: saveStatus,
      error: saveError,
      mutate: save,
    } = this.saveMutation()

    const disableEditSave = status === 'pending' || saveStatus === 'pending'

    return html`
      <div>
        <div>
          ${
            data
              ? html`
                  <button
                    type="button"
                    @click=${() => this.setEditingIndex(null)}
                  >
                    Back
                  </button>
                  Editing Todo "${data.name}" (#${this.editingIndex})
                `
              : null
          }
        </div>
        ${
          status === 'pending'
            ? html`<span>Loading... (Attempt: ${failureCount + 1})</span>`
            : status === 'error'
              ? html`
                  <span>
                    Error!
                    <button type="button" @click=${() => refetch()}>
                      Retry
                    </button>
                  </span>
                `
              : html`
                  <label>
                    Name:
                    <input
                      .value=${this.draft.name ?? data.name}
                      ?disabled=${disableEditSave}
                      @input=${(event: Event) =>
                        (this.draft = {
                          ...this.draft,
                          name: (event.currentTarget as HTMLInputElement).value,
                        })}
                    />
                  </label>
                  <label>
                    Notes:
                    <input
                      .value=${this.draft.notes ?? data.notes}
                      ?disabled=${disableEditSave}
                      @input=${(event: Event) =>
                        (this.draft = {
                          ...this.draft,
                          notes: (event.currentTarget as HTMLInputElement)
                            .value,
                        })}
                    />
                  </label>
                  <div>
                    <button
                      type="button"
                      ?disabled=${disableEditSave}
                      @click=${() => save({ ...data, ...this.draft })}
                    >
                      Save
                    </button>
                  </div>
                  <div>
                    ${
                      saveStatus === 'pending'
                        ? 'Saving...'
                        : saveStatus === 'error'
                          ? saveError.message
                          : saveStatus === 'success'
                            ? 'Saved!'
                            : null
                    }
                  </div>
                  <div>
                    ${
                      isFetching
                        ? html`<span>
                            Background Refreshing... (Attempt:
                            ${failureCount + 1})
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

customElements.define('edit-todo', EditTodo)
