export const todosAPI = {
  getTodos: (): Promise<Array<string>> => $fetch('/api/data'),
  createTodo: async (add: string) => {
    await $fetch('/api/data', { query: { add } })
  },
  deleteTodos: async () => {
    await $fetch('/api/data', { query: { clear: 1 } })
  },
}
