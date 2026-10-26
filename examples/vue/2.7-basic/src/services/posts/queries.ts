import { queryOptions } from '@tanstack/vue-query'
import { postsAPI } from './api'

export const postsQueries = {
  all: () => ['posts'] as const,
  list: () =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'list'] as const,
      queryFn: () => postsAPI.getPosts(),
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'detail', id] as const,
      queryFn: () => postsAPI.getPost(id),
    }),
}
