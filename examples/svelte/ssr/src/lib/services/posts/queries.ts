import { queryOptions } from '@tanstack/svelte-query'
import { postsAPI } from './api'

export const postsQueries = {
  all: () => ['posts'] as const,
  list: (limit: number, customFetch?: typeof fetch) =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'list', limit] as const,
      queryFn: () => postsAPI(customFetch).getPosts(limit),
    }),
  detail: (id: number, customFetch?: typeof fetch) =>
    queryOptions({
      queryKey: [...postsQueries.all(), 'detail', id] as const,
      queryFn: () => postsAPI(customFetch).getPost(id),
    }),
}
