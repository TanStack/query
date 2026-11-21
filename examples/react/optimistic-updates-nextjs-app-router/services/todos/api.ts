import type { Todo } from './types'

export const todosAPI = {
  getTodos: async (): Promise<Array<Todo>> => {
    const res = await fetch('/api/todos')
    if (!res.ok) throw new Error('Failed to fetch todos')
    return res.json()
  },
  createTodo: async (text: string): Promise<Todo> => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      const err = (await res.json()) as { error: string }
      throw new Error(err.error)
    }
    return res.json()
  },
}
