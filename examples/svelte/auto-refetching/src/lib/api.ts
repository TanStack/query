import { queryOptions } from '@tanstack/svelte-query'

const endpoint = '/api/data'

const fetchTodos = async (): Promise<{ items: Array<string> }> => {
  const response = await fetch(endpoint)
  if (!response.ok) throw new Error('Failed to fetch todos')
  return await response.json()
}

export const addTodo = async (value: string) => {
  const response = await fetch(`${endpoint}?add=${encodeURIComponent(value)}`)
  if (!response.ok) throw new Error('Failed to add todo')
  return await response.json()
}

export const clearTodos = async () => {
  const response = await fetch(`${endpoint}?clear=1`)
  if (!response.ok) throw new Error('Failed to clear todos')
  return await response.json()
}

export const todosQueryOptions = queryOptions({
  queryKey: ['refetch'],
  queryFn: fetchTodos,
})
