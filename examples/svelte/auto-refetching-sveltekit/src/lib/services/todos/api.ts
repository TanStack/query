import type { Todos } from './types'

const endpoint = '/api/data'

export const todosAPI = {
  getTodos: async (): Promise<Todos> => {
    const response = await fetch(endpoint)
    if (!response.ok) throw new Error('Failed to fetch todos')
    return await response.json()
  },
  createTodo: async (value: string) => {
    const response = await fetch(`${endpoint}?add=${encodeURIComponent(value)}`)
    if (!response.ok) throw new Error('Failed to add todo')
    return await response.json()
  },
  deleteTodos: async () => {
    const response = await fetch(`${endpoint}?clear=1`)
    if (!response.ok) throw new Error('Failed to clear todos')
    return await response.json()
  },
}
