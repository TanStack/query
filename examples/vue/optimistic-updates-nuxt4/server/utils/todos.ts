import type { Todo } from '../../app/services/todos/types'

export const todos: Array<Todo> = [
  {
    id: crypto.randomUUID(),
    text: 'Buy groceries',
    createdAt: Date.now() - 3000,
  },
  {
    id: crypto.randomUUID(),
    text: 'Walk the dog',
    createdAt: Date.now() - 2000,
  },
  {
    id: crypto.randomUUID(),
    text: 'Read a book',
    createdAt: Date.now() - 1000,
  },
]
