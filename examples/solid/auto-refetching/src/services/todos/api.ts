// an simple in-memory list on the server
let list = ['Item 1', 'Item 2', 'Item 3']

export const todosAPI = {
  getTodos: async (): Promise<Array<string>> => {
    'use server'

    await new Promise((r) => setTimeout(r, 100))
    return list
  },
  createTodo: async (add: string) => {
    'use server'

    if (add && !list.includes(add)) {
      list.push(add)
    }
    await new Promise((r) => setTimeout(r, 100))
  },
  deleteTodos: async () => {
    'use server'

    list = []
    await new Promise((r) => setTimeout(r, 100))
  },
}
