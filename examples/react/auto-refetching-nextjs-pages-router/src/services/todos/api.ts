export const todosAPI = {
  getTodos: async (): Promise<Array<string>> => {
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error('Failed to fetch todos')
    return await response.json()
  },
  createTodo: async (add: string) => {
    const response = await fetch(`/api/data?add=${encodeURIComponent(add)}`)
    if (!response.ok) throw new Error('Failed to add todo')
  },
  deleteTodos: async () => {
    const response = await fetch(`/api/data?clear=1`)
    if (!response.ok) throw new Error('Failed to clear todos')
  },
}
