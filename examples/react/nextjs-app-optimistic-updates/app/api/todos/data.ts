export interface Todo {
  id: string
  text: string
  createdAt: number
}

export const todos: Array<Todo> = [
  { id: crypto.randomUUID(), text: 'Buy groceries', createdAt: Date.now() - 3000 },
  { id: crypto.randomUUID(), text: 'Walk the dog', createdAt: Date.now() - 2000 },
  { id: crypto.randomUUID(), text: 'Read a book', createdAt: Date.now() - 1000 },
]

export async function getTodos(): Promise<Array<Todo>> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return todos
}
