import { queryOptions } from '@tanstack/react-query'

// ✅ passes: queryKey and queryFn are co-located via queryOptions()
export const todosOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: () => fetchTodos(),
})

// ✅ passes: factory function wrapping queryOptions()
export const todoOptions = (id: string) =>
  queryOptions({
    queryKey: ['todo', id],
    queryFn: () => fetchTodo(id),
  })

function fetchTodos(): Promise<Array<{ id: string; title: string }>> {
  throw new Error('not implemented')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fetchTodo(id: string): Promise<{ id: string; title: string }> {
  throw new Error('not implemented')
}
