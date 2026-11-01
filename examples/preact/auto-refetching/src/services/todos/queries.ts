import { mutationOptions, queryOptions } from '@tanstack/preact-query'
import { todosAPI } from './api'

export const todosQueries = {
  all: () => ['todos'] as const,
  list: () =>
    queryOptions({
      queryKey: [...todosQueries.all(), 'list'] as const,
      queryFn: () => todosAPI.getTodos(),
    }),
}

export const todosMutations = {
  create: () =>
    mutationOptions({
      mutationFn: (add: string) => todosAPI.createTodo(add),
    }),
  deleteAll: () =>
    mutationOptions({
      mutationFn: () => todosAPI.deleteTodos(),
    }),
}
