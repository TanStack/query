import { mutationOptions, queryOptions } from '@tanstack/svelte-query'
import { todosAPI } from './api'
import type { Todo } from './types'

export const todosQueries = {
  all: () => ['todos'] as const,
  lists: () => [...todosQueries.all(), 'list'] as const,
  list: (filter: string) =>
    queryOptions({
      queryKey: [...todosQueries.lists(), { filter }] as const,
      queryFn: () => todosAPI.getTodos({ filter }),
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
      mutationFn: (todo: Omit<Todo, 'id'>) => todosAPI.createTodo(todo),
    }),
  update: () =>
    mutationOptions({
      mutationFn: (todo: Todo) => todosAPI.updateTodo(todo),
    }),
}
