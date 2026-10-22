import { queryOptions } from '@tanstack/react-query'
import type { Todo } from '@/app/api/todos/data'

async function fetchTodos(): Promise<Array<Todo>> {
  const res = await fetch('/api/todos')
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json()
}

export async function addTodo(text: string): Promise<Todo> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    const err = (await res.json()) as { error: string }
    throw new Error(err.error)
  }
  return res.json()
}

export const todosQueryOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})
