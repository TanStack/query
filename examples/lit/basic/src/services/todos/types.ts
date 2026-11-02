export type Todo = {
  id: number
  title: string
}

export type TodosResponse = {
  items: Array<Todo>
  requestCount: number
  source: 'server' | 'cache'
}
