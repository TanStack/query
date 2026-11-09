export interface Todo {
  id: string
  title: string
  completed: boolean
}

export interface TodoPage {
  todos: Array<Todo>
  count: number
  nextCursor: string | null
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const todos: Array<Todo> = [
  { id: '1', title: 'Render on the server', completed: true },
  { id: '2', title: 'Hydrate in the browser', completed: false },
  { id: '3', title: 'Skip the refetch', completed: false },
  { id: '4', title: 'Load the next page', completed: false },
  { id: '5', title: 'Append a cursor page', completed: false },
  { id: '6', title: 'Keep the cache warm', completed: false },
]

export async function listTodos(): Promise<Array<Todo>> {
  await delay(120)
  return todos.map((todo) => ({ ...todo }))
}

export async function fetchTodoPage(params: {
  limit?: number
  cursor?: string
}): Promise<TodoPage> {
  await delay(120)
  const size = params.limit ?? 3
  const offset = Number(params.cursor ?? 0)
  const items = todos.slice(offset, offset + size)
  const end = offset + items.length
  return {
    todos: items.map((todo) => ({ ...todo })),
    count: todos.length,
    nextCursor: end < todos.length ? String(end) : null,
  }
}
