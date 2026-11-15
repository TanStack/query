import { infiniteQueryOptions, queryOptions } from '@tanstack/marko-query'
import { fetchTodoPage, listTodos } from './api.ts'

export const todosQueryOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: listTodos,
})

export const todoFeedQueryOptions = infiniteQueryOptions({
  queryKey: ['todos', 'feed'],
  queryFn: ({ pageParam }) => fetchTodoPage({ limit: 3, cursor: pageParam }),
  initialPageParam: '',
  getNextPageParam: (last) => last.nextCursor ?? undefined,
})
