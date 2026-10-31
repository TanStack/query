import { queryOptions } from '@tanstack/react-query'
import { postsAPI } from './api'

export const postsQueries = {
  all: () => ['posts'] as const,
  list: (limit: number) =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'list', limit] as const,
      queryFn: () => postsAPI.getPosts(limit),
    }),
}
