import { queryOptions } from '@tanstack/svelte-query'
import { postsAPI } from './api'

export const postsQueries = {
  all: () => ['posts'] as const,
  list: (limit: number) =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'list', limit] as const,
      queryFn: () => postsAPI.getPosts(limit),
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'detail', id] as const,
      queryFn: () => postsAPI.getPost(id),
    }),
}
