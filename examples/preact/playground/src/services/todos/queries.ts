import { mutationOptions, queryOptions } from '@tanstack/preact-query'
import { todosAPI } from './api'

export const todosQueries = {
  all: () => ['todos'] as const,
  lists: () => [...todosQueries.all(), 'list'] as const,
  list: (filter: string) =>
    queryOptions({
      queryKey: [...todosQueries.lists(), { filter }] as const,
      queryFn: ({ signal }) => todosAPI.getTodos({ filter, signal }),
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: [...todosQueries.all(), 'detail', id] as const,
      queryFn: () => todosAPI.getTodo({ id }),
    }),
}

export const todosMutations = {
  create: () =>
    mutationOptions({
      mutationFn: todosAPI.createTodo,
    }),
  update: () =>
    mutationOptions({
      mutationFn: todosAPI.updateTodo,
    }),
}
