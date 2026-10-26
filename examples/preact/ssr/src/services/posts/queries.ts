import { queryOptions } from '@tanstack/preact-query'
import { postsAPI } from './api'

export const postsQueries = {
  all: () => ['posts'] as const,
  list: () =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'list'] as const,
      queryFn: () => postsAPI.getPosts(),
    }),
}
