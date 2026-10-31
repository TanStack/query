import type { Todo } from './types'

const todos: Array<Todo> = [
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

export const todosAPI = {
  getTodos: async (): Promise<Array<Todo>> => {
    'use server'

    await new Promise((resolve) => setTimeout(resolve, 200))
    return todos
  },
  createTodo: async (text: string): Promise<Todo> => {
    'use server'

    const trimmedText = text.trim()
    if (!trimmedText) {
      throw new Error('text is required')
    }

    await new Promise((resolve) => setTimeout(resolve, 500))

    if (Math.random() < 0.3) {
      throw new Error('Server error — please try again')
    }

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: trimmedText,
      createdAt: Date.now(),
    }

    todos.push(newTodo)

    return newTodo
  },
}
