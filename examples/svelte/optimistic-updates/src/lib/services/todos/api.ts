import type { Todo, Todos } from './types'

const endpoint = '/api/data'

export const todosAPI = {
  getTodos: async (): Promise<Todos> => {
    const response = await fetch(endpoint)
    if (!response.ok) throw new Error('Failed to fetch todos')
    return await response.json()
  },
  createTodo: async (text: string): Promise<Todo> => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    })
    if (!response.ok) {
      const { message } = (await response.json()) as { message: string }
      throw new Error(message)
    }
    return await response.json()
  },
}
