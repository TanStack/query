export type Todo = {
  id: number
  title: string
}

export type TodosResponse = {
  items: Todo[]
  requestCount: number
  source: 'server' | 'cache'
}

let todos: Todo[] = [
  { id: 1, title: 'Ship lit-query alpha' },
  { id: 2, title: 'Write integration checks' },
]

let requestCount = 0
let nextTodoId = 3
let failNextFetch = false
let failNextMutation = false

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export async function fetchTodosFromServer(): Promise<TodosResponse> {
  await delay(90)
  if (failNextFetch) {
    failNextFetch = false
    throw new Error('Forced fetch failure (test)')
  }
  requestCount += 1

  return {
    items: todos.map((todo) => ({ ...todo })),
    requestCount,
    source: 'server',
  }
}

export async function addTodoOnServer(title: string): Promise<Todo> {
  await delay(70)
  if (failNextMutation) {
    failNextMutation = false
    throw new Error('Forced mutation failure (test)')
  }

  const nextTodo: Todo = {
    id: nextTodoId,
    title,
  }

  nextTodoId += 1
  todos = [...todos, nextTodo]

  return { ...nextTodo }
}

export function resetTodoApi(): void {
  todos = [
    { id: 1, title: 'Ship lit-query alpha' },
    { id: 2, title: 'Write integration checks' },
  ]
  requestCount = 0
  nextTodoId = 3
  failNextFetch = false
  failNextMutation = false
}

export function failNextFetchRequest(): void {
  failNextFetch = true
}

export function failNextMutationRequest(): void {
  failNextMutation = true
}
