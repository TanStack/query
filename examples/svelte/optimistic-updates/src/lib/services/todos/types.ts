export type Todo = {
  id: string
  text: string
}

export type Todos = {
  items: ReadonlyArray<Todo>
  ts: number
}
