import { mutationOptions, queryOptions } from '@tanstack/svelte-query'
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
      mutationFn: (text: string) => todosAPI.createTodo(text),
    }),
}
