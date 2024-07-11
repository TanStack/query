import { mockFn } from 'jest-mock-extended'
import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { QueryController } from '../QueryController'
import { vi } from 'vitest'

export const A_TODO_ID = 1
export const A_TODO = {
  userId: 1,
  id: 1,
  title: 'My first todo',
  completed: false,
}
export const ANOTHER_TODO_ID = 2
export const ANOTHER_TODO = {
  userId: 1,
  id: 2,
  title: 'My second todo',
  completed: false,
}

export type Todo = {
  readonly userId: number
  readonly id: number
  readonly title: string
  readonly completed: boolean
}

export const getTodoById = vi.fn<[todoId: number], Promise<Todo>>()

export class ReadOneTodoComponent extends LitElement {
  @property({ type: Number })
  todoId = 1

  private todoQuery = new QueryController(this, () => ({
    queryKey: ['todo', this.todoId],
    queryFn: () => getTodoById(this.todoId),
  }))

  render() {
    const { result } = this.todoQuery

    if (result.isPending) {
      return html`<div>Loading...</div>`
    }

    if (result.isError) {
      return html`<div>Error</div>`
    }

    const { userId, id, title, completed } = result.data
    return html`<div>
      userId: ${userId}, id: ${id}, title: ${title}, completed: ${completed}
    </div>`
  }
}
