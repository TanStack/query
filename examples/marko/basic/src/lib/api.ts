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

// A tiny in-memory API. The examples run without a backend, and the delay keeps
// the loading states visible.
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let todos: Array<Todo> = [
  { id: '1', title: 'Read the Marko Query docs', completed: true },
  { id: '2', title: 'Render a query on the server', completed: false },
  { id: '3', title: 'Invalidate the cache', completed: false },
  { id: '4', title: 'Add a mutation', completed: false },
  { id: '5', title: 'Load the next page', completed: false },
  { id: '6', title: 'Stream a slow query', completed: false },
  { id: '7', title: 'Hydrate the browser cache', completed: false },
  { id: '8', title: 'Select derived data', completed: false },
  { id: '9', title: 'Disable a query', completed: false },
  { id: '10', title: 'Handle a query error', completed: false },
  { id: '11', title: 'Combine parallel queries', completed: false },
  { id: '12', title: 'Fetch the last page', completed: false },
]

let nextId = todos.length + 1
let failNextToggle = false

export async function listTodos(): Promise<Array<Todo>> {
  await delay(120)
  return todos.map((todo) => ({ ...todo }))
}

export async function fetchTodoPage(params: {
  page?: number
  pageSize?: number
  limit?: number
  cursor?: string
}): Promise<TodoPage> {
  await delay(120)
  const size = params.pageSize ?? params.limit ?? 5
  const offset =
    params.page !== undefined
      ? (params.page - 1) * size
      : Number(params.cursor ?? 0)
  const items = todos.slice(offset, offset + size)
  const end = offset + items.length
  return {
    todos: items.map((todo) => ({ ...todo })),
    count: todos.length,
    nextCursor: end < todos.length ? String(end) : null,
  }
}

export async function createTodo(title: string): Promise<Todo> {
  await delay(120)
  const todo: Todo = { id: String(nextId++), title, completed: false }
  todos = [...todos, todo]
  return { ...todo }
}

export async function toggleTodo(id: string): Promise<Todo> {
  await delay(120)
  if (failNextToggle) {
    failNextToggle = false
    throw new Error('Forced toggle failure')
  }
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  )
  const updated = todos.find((todo) => todo.id === id)
  if (!updated) throw new Error(`Todo ${id} not found`)
  return { ...updated }
}

/** Makes the next `toggleTodo` reject, so an optimistic update can roll back. */
export function failNextToggleRequest(): void {
  failNextToggle = true
}

export async function fetchSlowTodoPage(): Promise<TodoPage> {
  await delay(1500)
  return fetchTodoPage({ page: 1, pageSize: 5 })
}

export async function fetchBroken(): Promise<string> {
  await delay(120)
  throw new Error('This query always fails')
}
