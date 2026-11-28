import { mutationOptions, suspenseQueryOptions } from '@tanstack/react-query'
import { todosAPI } from './api'

export const todosQueries = {
  all: () => ['todos'] as const,
  list: () =>
    suspenseQueryOptions({
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
