import {
  createMutationController,
  createQueryController,
  invalidateQueries,
  isFetching,
  setQueryData,
} from '@tanstack/lit-query'
import { LitElement, html } from 'lit'
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
      invalidateQueries(client, { queryKey: todosQueries.lists() })
      setQueryData(
        client,
        todosQueries.detail(this.editingIndex).queryKey,
        todo,
      )
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
    const queryResult = this.todo()
    const {
      status: saveStatus,
      error: saveError,
      mutate: save,
    } = this.saveMutation()

    const disableEditSave =
      queryResult.status === 'pending' || saveStatus === 'pending'

    return html`
      <div>
        <div>
          ${
            queryResult.data
              ? html`
                  <button
                    type="button"
                    @click=${() => this.setEditingIndex(null)}
                  >
                    Back
                  </button>
                  Editing Todo "${queryResult.data.name}"
                  (#${this.editingIndex})
                `
              : null
          }
        </div>
        ${
          queryResult.status === 'pending'
            ? html`<span
                >Loading... (Attempt: ${queryResult.failureCount + 1})</span
              >`
            : queryResult.status === 'error'
              ? html`
                  <span>
                    Error!
                    <button type="button" @click=${() => queryResult.refetch()}>
                      Retry
                    </button>
                  </span>
                `
              : html`
                  <label>
                    Name:
                    <input
                      .value=${this.draft.name ?? queryResult.data.name}
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
                      .value=${this.draft.notes ?? queryResult.data.notes}
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
                      @click=${() => save({ ...queryResult.data, ...this.draft })}
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

customElements.define('edit-todo', EditTodo)
